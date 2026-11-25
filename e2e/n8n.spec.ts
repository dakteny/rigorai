import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

// Opt in explicitly: every run sends a real request to the configured n8n webhook.
test.skip(!process.env["E2E_N8N"], "Set E2E_N8N=1 to send a real n8n integration check.");

test("an authenticated user runs only their own active workflow and reads back its real n8n result", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const url = process.env["SUPABASE_URL"];
  const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !publishableKey || !serviceKey)
    throw new Error("Test-runner Supabase credentials are required.");
  const backend = (key: string) =>
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => {
          const headers = new Headers(init?.headers);
          if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`)
            headers.delete("Authorization");
          headers.set("apikey", key);
          return fetch(input, { ...init, headers });
        },
      },
    });
  const admin = backend(serviceKey);
  const email = `rigor-n8n-${randomUUID()}@example.com`;
  const password = `Rigor-${randomUUID()}-9!`;
  const input = `Rigor n8n integration check ${randomUUID()}`;
  let userId: string | undefined;
  let automationId: string | undefined;

  try {
    const account = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Rigor E2E" },
    });
    if (account.error) throw new Error("Unable to create the isolated n8n test account.");
    userId = account.data.user.id;
    const automation = await admin
      .from("automations")
      .insert({
        user_id: userId,
        name: `n8n check ${randomUUID()}`,
        description: "Disposable real integration check",
        category: "Business",
        trigger_config: { type: "Manual trigger" },
        action_config: { type: "Send notification" },
        status: "active",
      })
      .select("id, name")
      .single();
    if (automation.error || !automation.data)
      throw new Error("Unable to create the test workflow.");
    automationId = automation.data.id;

    await page.goto("/auth?mode=login");
    await page.getByLabel("Email address", { exact: true }).fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.goto("/integrations");
    const n8nCard = page
      .locator("article")
      .filter({ has: page.getByRole("heading", { name: "n8n" }) });
    await expect(n8nCard.getByText("Webhook configured", { exact: true })).toBeVisible();
    await page.goto("/automations");
    await page.getByRole("button", { name: `Run ${automation.data.name}`, exact: true }).click();
    const runDialog = page.getByRole("dialog");
    await runDialog.getByLabel("Workflow input", { exact: true }).fill(input);
    await runDialog.getByRole("button", { name: "Run Automation", exact: true }).click();
    const outcome = runDialog.locator('[role="status"], [role="alert"]');
    await expect(outcome).toBeVisible({ timeout: 45_000 });
    const uiStatus = (await outcome.locator(".status").innerText()).trim().toLowerCase();

    const execution = await admin
      .from("automation_executions")
      .select("*")
      .eq("automation_id", automationId)
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();
    expect(execution.error).toBeNull();
    console.log(
      `n8n verification: ${execution.data.execution_status}${execution.data.error_message ? ` — ${execution.data.error_message}` : ""}`,
    );
    expect(execution.data.execution_status).toBe(uiStatus);
    expect(execution.data.completed_at).not.toBeNull();
    const details = execution.data.execution_data as { input?: unknown; output?: unknown };
    expect(details.input).toBe(input);
    if (uiStatus === "completed") {
      expect(execution.data.error_message).toBeNull();
      expect(details.output).toEqual(expect.any(String));
    } else {
      expect(uiStatus).toBe("failed");
      expect(execution.data.error_message).toEqual(expect.any(String));
    }

    await runDialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("button", { name: `View history for ${automation.data.name}`, exact: true })
      .click();
    const history = page.getByRole("dialog");
    await expect(history.locator(".status")).toHaveText(uiStatus);
    if (execution.data.error_message)
      await expect(history).toContainText(execution.data.error_message);
    if (typeof details.output === "string") await expect(history).toContainText(details.output);
  } finally {
    if (automationId)
      await admin.from("automation_executions").delete().eq("automation_id", automationId);
    if (automationId) await admin.from("automations").delete().eq("id", automationId);
    if (userId) await admin.auth.admin.deleteUser(userId);
  }
});
