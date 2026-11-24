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

let service: ReturnType<typeof backend>;
let actor: ReturnType<typeof backend>;
let accountId = "";
let email = "";
let password = "";
const accounts: string[] = [];
let originalPhone: string | undefined;
let testPhone: string | undefined;

test.beforeEach(async () => {
  const secret = process.env["SUPABASE_SERVICE_ROLE_KEY"],
    key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!secret || !key) throw new Error("Real test credentials are required");
  service = backend(secret);
  actor = backend(key);
  originalPhone = undefined;
  testPhone = undefined;
  accounts.length = 0;
  email = `rigor-website-admin-${randomUUID()}@example.com`;
  password = `Rigor-${randomUUID()}-9!`;
  const user = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Rigor verification" },
  });
  if (user.error) throw new Error("Isolated administrator creation failed");
  accountId = user.data.user.id;
  accounts.push(accountId);
  const role = await service.from("user_roles").insert({ user_id: accountId, role: "admin" });
  if (role.error) throw new Error("Isolated administrator access failed");
  const login = await actor.auth.signInWithPassword({ email, password });
  if (login.error) throw new Error("Isolated administrator sign-in failed");
});
test.afterEach(async () => {
  if (originalPhone && testPhone) {
    const current = await actor
      .from("website_settings")
      .select("phone")
      .eq("id", "primary")
      .single();
    if (current.data?.phone === testPhone) {
      const restored = await actor
        .from("website_settings")
        .update({ phone: originalPhone })
        .eq("id", "primary");
      if (restored.error) throw new Error("Contact formatting restoration failed");
    }
  }
  // Preserve truthful audit history and its actor snapshot; remove only this runner's accounts.
  for (const id of accounts) {
    const removed = await service.auth.admin.deleteUser(id);
    if (removed.error) throw new Error("Isolated verification account cleanup failed");
  }
});

test("administrator accesses all plans and settings changes record who, when and previous values", async ({
  page,
}) => {
  test.setTimeout(180_000);
  page.setDefaultTimeout(20_000);
  const beforeSubscription = await service
    .from("subscriptions")
    .select("*")
    .eq("user_id", accountId);
  if (beforeSubscription.error) throw new Error("Subscription inspection failed");
  await page.goto("/auth?mode=login");
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  await expect.poll(() => new URL(page.url()).pathname).toBe("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome, Rigor." })).toBeVisible();
  await page.goto("/pricing");
  for (const plan of ["Free", "Pro", "Business"])
    await expect(
      page.getByRole("link", { name: `Open ${plan} access`, exact: true }),
    ).toBeVisible();
  await page.getByRole("link", { name: "Open Pro access", exact: true }).click();
  await expect(page).toHaveURL(/\/billing$/);
  await expect(
    page.getByRole("heading", { name: "Free · Pro · Business", exact: true }),
  ).toBeVisible();
  const afterSubscription = await service
    .from("subscriptions")
    .select("*")
    .eq("user_id", accountId);
  expect(afterSubscription.data).toEqual(beforeSubscription.data);

  const original = await actor.from("website_settings").select("*").eq("id", "primary").single();
  if (original.error || !original.data) throw new Error("Website settings unavailable");
  originalPhone = original.data.phone;
  testPhone = originalPhone.includes("(")
    ? originalPhone.replace(/[()]/g, "")
    : `(${originalPhone})`;
  const started = Date.now();
  await page.goto("/admin");
  await page.getByRole("tab", { name: "Website Settings", exact: true }).click();
  const panel = page.getByRole("tabpanel", { name: "Website Settings", exact: true });
  await panel.getByLabel("Phone", { exact: true }).fill(testPhone);
  await page.getByRole("button", { name: "Save website settings", exact: true }).click();
  await expect(page.getByText("Website settings saved.", { exact: true })).toBeVisible();
  const audit = await actor
    .from("website_settings_audit")
    .select("*")
    .eq("actor_id", accountId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (audit.error || !audit.data)
    throw new Error("Settings change did not produce an audit record");
  expect(audit.data.actor_id === accountId).toBe(true);
  expect(audit.data.actor_email === email).toBe(true);
  expect(audit.data.actor_name).toBe("Rigor verification");
  expect(audit.data.changes).toEqual({ phone: { before: originalPhone, after: testPhone } });
  expect(new Date(audit.data.created_at).getTime()).toBeGreaterThanOrEqual(started - 1000);
  expect(new Date(audit.data.created_at).getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  await page.getByRole("tab", { name: "Audit Log", exact: true }).click();
  await page.getByLabel("Search audit log").fill(email);
  const history = page.getByRole("tabpanel", { name: "Audit Log", exact: true });
  await expect(
    history.getByRole("heading", { name: "Rigor verification", exact: true }),
  ).toBeVisible();
  await expect(history.getByText(testPhone, { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Audit Log", exact: true }).click();
  await page.getByLabel("Search audit log").fill(email);
  await expect(history.getByText(testPhone, { exact: true })).toBeVisible();
  await page.goto("/");
  await expect(page.locator("footer").getByText(testPhone, { exact: true })).toBeVisible();

  const restored = await actor
    .from("website_settings")
    .update({ phone: originalPhone })
    .eq("id", "primary");
  if (restored.error) throw new Error("Contact formatting restoration failed");
  const countBefore = await actor
    .from("website_settings_audit")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", accountId);
  const noChange = await actor
    .from("website_settings")
    .update({ phone: originalPhone })
    .eq("id", "primary");
  if (noChange.error) throw new Error("No-change verification failed");
  const countAfter = await actor
    .from("website_settings_audit")
    .select("id", { count: "exact", head: true })
    .eq("actor_id", accountId);
  expect(countBefore.count).toBe(2);
  expect(countAfter.count).toBe(2);

  const customerEmail = `rigor-website-customer-${randomUUID()}@example.com`,
    customerPassword = `Rigor-${randomUUID()}-9!`;
  const customer = await service.auth.admin.createUser({
    email: customerEmail,
    password: customerPassword,
    email_confirm: true,
  });
  if (customer.error) throw new Error("Isolated customer creation failed");
  accounts.push(customer.data.user.id);
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!key) throw new Error("Account configuration unavailable");
  const client = backend(key);
  const signedIn = await client.auth.signInWithPassword({
    email: customerEmail,
    password: customerPassword,
  });
  if (signedIn.error) throw new Error("Isolated customer sign-in failed");
  const deniedChange = await client
    .from("website_settings")
    .update({ phone: "Unauthorized" })
    .eq("id", "primary")
    .select();
  expect(deniedChange.error !== null || deniedChange.data?.length === 0).toBe(true);
  const hidden = await client.from("website_settings_audit").select("*");
  expect(hidden.data).toEqual([]);
  const fabricated = await client
    .from("website_settings_audit")
    .insert({
      actor_id: accountId,
      actor_name: "Fake",
      actor_email: "fake@example.com",
      changes: { phone: { before: "1", after: "2" } },
    });
  expect(fabricated.error?.code).toBe("42501");
  const altered = await client
    .from("website_settings_audit")
    .update({ actor_name: "Fake" })
    .eq("id", audit.data.id);
  const deleted = await client.from("website_settings_audit").delete().eq("id", audit.data.id);
  expect(altered.error?.code).toBe("42501");
  expect(deleted.error?.code).toBe("42501");
});
