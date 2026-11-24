import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

function backend(key: string) {
  const url = process.env["SUPABASE_URL"];
  if (!url) throw new Error("Real account configuration is required");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
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
}

test("row-level rules isolate customers and prevent fabricated privileges and platform records", async ({ page }) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(20_000);
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"],
    key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!secret || !key) throw new Error("Real test credentials are required");
  const service = backend(secret),
    visitor = backend(key);
  const accounts: string[] = [];
  const workflows: string[] = [];
  const agents: string[] = [];
  try {
    async function createCustomer() {
      const email = `rigor-rls-${randomUUID()}@example.com`,
        password = `Rigor-${randomUUID()}-9!`;
      const created = await service.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Rigor policy verification" },
      });
      if (created.error) throw new Error("Isolated customer creation failed");
      const id = created.data.user.id;
      accounts.push(id);
      const client = backend(key);
      const session = await client.auth.signInWithPassword({ email, password });
      if (session.error) throw new Error("Isolated customer sign-in failed");
      const workflow = await client
        .from("automations")
        .insert({ user_id: id, name: "Private draft workflow", status: "draft" })
        .select("id")
        .single();
      const agent = await client
        .from("ai_agents")
        .insert({
          user_id: id,
          name: "Private inactive agent",
          instructions: "Assist with customer requests",
          status: "inactive",
        })
        .select("id")
        .single();
      if (workflow.error || agent.error || !workflow.data || !agent.data)
        throw new Error("Own private record creation failed");
      workflows.push(workflow.data.id);
      agents.push(agent.data.id);
      return { id, client, email, password, workflowId: workflow.data.id, agentId: agent.data.id };
    }
    const a = await createCustomer(),
      b = await createCustomer();
    const own = await a.client.from("automations").select("id, status");
    expect(own.data).toEqual([{ id: a.workflowId, status: "draft" }]);
    const otherWorkflow = await a.client.from("automations").select("id").eq("id", b.workflowId);
    const otherAgent = await a.client.from("ai_agents").select("id").eq("id", b.agentId);
    const otherProfile = await a.client.from("profiles").select("id").eq("id", b.id);
    expect(otherWorkflow.data).toEqual([]);
    expect(otherAgent.data).toEqual([]);
    expect(otherProfile.data).toEqual([]);
    const ownEdit = await a.client
      .from("automations")
      .update({ name: "Edited private draft" })
      .eq("id", a.workflowId)
      .select("name")
      .single();
    expect(ownEdit.data?.name).toBe("Edited private draft");
    const otherEdit = await a.client
      .from("automations")
      .update({ name: "Unauthorized change" })
      .eq("id", b.workflowId)
      .select("id");
    const otherDelete = await a.client.from("ai_agents").delete().eq("id", b.agentId).select("id");
    expect(otherEdit.data).toEqual([]);
    expect(otherDelete.data).toEqual([]);
    const unchanged = await service
      .from("automations")
      .select("name, user_id")
      .eq("id", b.workflowId)
      .single();
    expect(unchanged.data?.name).toBe("Private draft workflow");
    expect(unchanged.data?.user_id).toBe(b.id);

    // Test-only records belong to disposable accounts, never existing customer accounts.
    const fixtures = await Promise.all([
      service.from("subscriptions").insert({ user_id: b.id, plan: "free", subscription_status: "active" }),
      service.from("integrations").insert({ user_id: b.id, provider: "Stripe", connection_status: "disconnected" }),
      service.from("notifications").insert({ user_id: b.id, title: "Private B notification", message: "Isolation fixture" }),
      service.from("agent_conversations").insert({ user_id: b.id, agent_id: b.agentId, prompt: "Isolation fixture", response: "Test-only private conversation" }),
      service.from("automation_executions").insert({ user_id: b.id, automation_id: b.workflowId, execution_status: "failed", error_message: "Test-only isolation fixture; not an actual run" }),
    ]);
    if (fixtures.some((result) => result.error)) throw new Error("Private isolation fixture creation failed");
    for (const table of ["automations", "ai_agents", "integrations", "notifications", "agent_conversations", "automation_executions", "activity_logs", "subscriptions", "user_roles"]) {
      const ownerRead = await b.client.from(table).select("user_id").eq("user_id", b.id);
      expect(ownerRead.error).toBeNull();
      expect((ownerRead.data?.length ?? 0) > 0, `${table} must contain real private test rows`).toBe(true);
      const otherRead = await a.client.from(table).select("user_id").eq("user_id", b.id);
      expect(otherRead.error).toBeNull();
      expect(otherRead.data, `${table} must hide another customer's work`).toEqual([]);
    }

    async function login(account: typeof a) {
      await page.goto("/auth?mode=login");
      await page.getByLabel("Email address", { exact: true }).fill(account.email);
      await page.getByLabel("Password", { exact: true }).fill(account.password);
      await page.getByRole("button", { name: "Log in", exact: true }).click();
      await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard");
    }
    await login(a);
    await page.goto("/billing");
    await page.getByRole("link", { name: "Open Free access", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard");
    await page.goto("/automations");
    await expect(page.getByRole("heading", { name: "Edited private draft", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Private draft workflow", exact: true })).toHaveCount(0);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Access restricted", exact: true })).toBeVisible();
    // Switch accounts in the same browser to check both persisted and cached isolation.
    const menu = page.getByRole("button", { name: "Open sidebar", exact: true });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole("button", { name: "Log out", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/auth");
    expect((await page.getByLabel("Email address", { exact: true }).inputValue()) === "").toBe(true);
    expect((await page.getByLabel("Password", { exact: true }).inputValue()) === "").toBe(true);
    await login(b);
    await page.goto("/automations");
    await expect(page.getByRole("heading", { name: "Private draft workflow", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Edited private draft", exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Private draft workflow", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Edited private draft", exact: true })).toHaveCount(0);
    const transferred = await a.client
      .from("automations")
      .update({ user_id: b.id })
      .eq("id", a.workflowId);
    expect(transferred.error?.code).toBe("42501");

    const foreignWorkflowDelete = await a.client.from("automations").delete().eq("id", b.workflowId).select("id");
    const foreignAgentEdit = await a.client.from("ai_agents").update({ instructions: "Unauthorized instructions" }).eq("id", b.agentId).select("id");
    expect(foreignWorkflowDelete.data).toEqual([]);
    expect(foreignAgentEdit.data).toEqual([]);
    const foreignWorkflowCreate = await a.client.from("automations").insert({ user_id: b.id, name: "Unauthorized workflow" });
    const foreignAgentCreate = await a.client.from("ai_agents").insert({ user_id: b.id, name: "Unauthorized agent", instructions: "Unauthorized instructions" });
    const transferAgent = await a.client.from("ai_agents").update({ user_id: b.id }).eq("id", a.agentId);
    expect(foreignWorkflowCreate.error?.code).toBe("42501");
    expect(foreignAgentCreate.error?.code).toBe("42501");
    expect(transferAgent.error?.code).toBe("42501");
    const preservedAgent = await b.client.from("ai_agents").select("instructions").eq("id", b.agentId).single();
    expect(preservedAgent.data?.instructions).toBe("Assist with customer requests");
    const preservedWorkflow = await b.client.from("automations").select("name").eq("id", b.workflowId).single();
    expect(preservedWorkflow.data?.name).toBe("Private draft workflow");

    const elevated = await a.client.from("user_roles").insert({ user_id: a.id, role: "admin" });
    expect(elevated.error?.code).toBe("42501");
    const selfStatus = await a.client.from("profiles").update({ disabled: false }).eq("id", a.id);
    const spoofEmail = await a.client
      .from("profiles")
      .update({ email: "spoofed@example.com" })
      .eq("id", a.id);
    expect(selfStatus.error?.code).toBe("42501");
    expect(spoofEmail.error?.code).toBe("42501");
    const profileEdit = await a.client
      .from("profiles")
      .update({ full_name: "Updated customer profile" })
      .eq("id", a.id)
      .select("full_name")
      .single();
    expect(profileEdit.data?.full_name).toBe("Updated customer profile");
    const ownRoles = await a.client.from("user_roles").select("role").eq("user_id", a.id);
    expect(ownRoles.data).toEqual([{ role: "customer" }]);

    const payment = await a.client
      .from("subscriptions")
      .insert({ user_id: a.id, plan: "business", subscription_status: "active" });
    const execution = await a.client
      .from("automation_executions")
      .insert({ user_id: a.id, automation_id: a.workflowId, execution_status: "completed" });
    const connection = await a.client
      .from("integrations")
      .insert({ user_id: a.id, provider: "Stripe", connection_status: "connected" });
    const log = await a.client
      .from("activity_logs")
      .insert({ user_id: a.id, action: "fake", description: "Fabricated activity" });
    expect(payment.error?.code).toBe("42501");
    expect(execution.error?.code).toBe("42501");
    expect(connection.error?.code).toBe("42501");
    expect(log.error?.code).toBe("42501");
    const notification = await service
      .from("notifications")
      .insert({
        user_id: a.id,
        title: "Policy verification",
        message: "Isolated test notification",
      })
      .select("id")
      .single();
    if (notification.error || !notification.data)
      throw new Error("Isolated notification creation failed");
    const markRead = await a.client
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notification.data.id)
      .select("is_read")
      .single();
    expect(markRead.data?.is_read).toBe(true);
    const rewriteNotification = await a.client
      .from("notifications")
      .update({ title: "Fake system notification" })
      .eq("id", notification.data.id);
    expect(rewriteNotification.error?.code).toBe("42501");

    const publicSettings = await visitor.from("website_settings").select("id");
    expect(publicSettings.data).toEqual([{ id: "primary" }]);
    for (const table of [
      "profiles",
      "user_roles",
      "automations",
      "ai_agents",
      "website_settings_audit",
    ]) {
      const privateRead = await visitor.from(table).select("*");
      expect(privateRead.error?.code).toBe("42501");
    }
    const internalHelper = await visitor.rpc("rigor_active_account");
    expect(internalHelper.error !== null).toBe(true);

    const disabled = await service.from("profiles").update({ disabled: true }).eq("id", a.id);
    if (disabled.error) throw new Error("Isolated account disabling failed");
    const disabledRead = await a.client.from("automations").select("id");
    expect(disabledRead.data).toEqual([]);
    const selfEnable = await a.client.from("profiles").update({ disabled: false }).eq("id", a.id);
    expect(selfEnable.error?.code).toBe("42501");
    const stillDisabled = await service.from("profiles").select("disabled").eq("id", a.id).single();
    expect(stillDisabled.data?.disabled).toBe(true);
  } finally {
    // Remove fixture children first so foreign-key references cannot obstruct cleanup.
    for (const id of accounts) {
      await service.from("automation_executions").delete().eq("user_id", id);
      await service.from("agent_conversations").delete().eq("user_id", id);
    }
    for (const id of workflows) await service.from("automations").delete().eq("id", id);
    for (const id of agents) await service.from("ai_agents").delete().eq("id", id);
    for (const id of accounts) {
      const removed = await service.auth.admin.deleteUser(id);
      if (removed.error) throw new Error("Isolated policy-verification account cleanup failed");
    }
  }
});
