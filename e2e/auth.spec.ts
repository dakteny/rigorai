import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

// Test-runner clients only; secrets never reach browser code or saved artifacts.
function backend(key: string) {
  const url = process.env['SUPABASE_URL'];
  if (!url) throw new Error('SUPABASE_URL is required for real authentication checks.');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
      headers.set('apikey', key);
      return fetch(input, { ...init, headers });
    } },
  });
}
const paths = ['/dashboard', '/automations', '/agents', '/integrations', '/templates', '/activity', '/analytics', '/billing', '/settings', '/support', '/admin'];
let admin: ReturnType<typeof backend>;
let publicClient: ReturnType<typeof backend>;
let accountId: string | undefined;
let email = '';
let password = '';

async function locateCreatedAccount() {
  for (let page = 1; page <= 20; page++) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) throw new Error('Unable to inspect the isolated test account.');
    const user = result.data.users.find(user => user.email === email);
    if (user) return user.id;
    if (result.data.users.length < 1000) break;
  }
  return undefined;
}
async function signIn(page: Page) {
  await page.goto('/auth?mode=login');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Welcome, Rigor.' })).toBeVisible();
}
test.describe('Real account lifecycle', () => {
  test.beforeEach(async ({}, testInfo) => {
    const secret = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!secret || !key) throw new Error('Test-runner Supabase credentials are required; auth is never mocked.');
    admin = backend(secret); publicClient = backend(key);
    accountId = undefined; email = '';
    const inbox = process.env['E2E_EMAIL_ADDRESS'];
    const needsInbox = testInfo.title.startsWith('sign-up') || testInfo.title.startsWith('password reset email');
    test.skip(needsInbox && !inbox, 'Set E2E_EMAIL_ADDRESS to an inbox you control for real signup and reset emails.');
    const tag = randomUUID();
    if (inbox) {
      const [local, domain] = inbox.split('@');
      if (!local || !domain) throw new Error('E2E_EMAIL_ADDRESS must be a valid controlled test inbox.');
      email = `${local}+rigor-e2e-${tag}@${domain}`;
    } else email = `rigor-e2e-${tag}@example.com`;
    password = `Rigor-${randomUUID()}-9!`;
    if (!testInfo.title.startsWith('sign-up')) {
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: 'Rigor E2E' } });
      if (created.error) throw new Error(`Unable to provision the isolated test account (${created.error.code ?? created.error.status}).`);
      accountId = created.data.user.id;
    }
  });
  test.afterEach(async () => {
    // Only delete this suite's unique account, even if signup partially failed.
    if (!email) return;
    const id = accountId ?? await locateCreatedAccount();
    if (!id) return;
    const result = await admin.auth.admin.deleteUser(id);
    if (result.error) throw new Error('Isolated test account cleanup failed.');
  });
  test('sign-up creates a customer profile and waits for email confirmation', async ({ page }) => {
    await page.goto('/auth?mode=signup');
    await page.getByLabel('Full name', { exact: true }).fill('Rigor E2E');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    const signupResponse = page.waitForResponse(r => r.url().includes('/auth/v1/signup') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    const signup = await signupResponse;
    if (!signup.ok()) {
      const failure: { code?: string; error_code?: string } = await signup.json();
      throw new Error(`Sign-up provider rejected the request: HTTP ${signup.status()}, code ${failure.code ?? failure.error_code ?? 'unknown'}.`);
    }
    await expect(page.getByRole('status')).toContainText('Check your email to confirm your account');
    await expect(page).toHaveURL(/\/auth\?mode=signup$/);
    accountId = await locateCreatedAccount();
    expect(Boolean(accountId), 'Sign-up must create a real Auth user').toBe(true);
    if (!accountId) throw new Error('Sign-up did not create an isolated account.');
    const profile = await admin.from('profiles').select('full_name').eq('id', accountId).single();
    expect(profile.error === null).toBe(true);
    expect(profile.data?.full_name).toBe('Rigor E2E');
    const roles = await admin.from('user_roles').select('role').eq('user_id', accountId);
    expect(roles.error === null).toBe(true);
    expect(roles.data?.map(role => role.role)).toEqual(['customer']);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\?mode=login$/);
    const rejected = await publicClient.auth.signInWithPassword({ email, password });
    expect(rejected.data.session === null, 'Unconfirmed accounts cannot sign in').toBe(true);
    // Confirm only this user, never change hosted auth settings.
    const confirmed = await admin.auth.admin.updateUserById(accountId, { email_confirm: true });
    if (confirmed.error) throw new Error('Unable to confirm the isolated test account.');
  });
  test('sign-in validates credentials, survives reload, and logout removes private access', async ({ page }) => {
    await page.goto('/auth?mode=login');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    await page.getByLabel('Password', { exact: true }).fill(`${password}-wrong`);
    await page.getByRole('button', { name: 'Log in', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\?mode=login$/);
    await signIn(page);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome, Rigor.' })).toBeVisible();
    const menu = page.getByRole('button', { name: 'Open sidebar', exact: true });
    if (await menu.isVisible()) await menu.click();
    await page.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\?mode=login$/);
    await page.goto('/automations');
    await expect(page).toHaveURL(/\/auth\?mode=login$/);
  });
  test('password reset email request is accepted by the real provider', async ({ page }) => {
    await page.goto('/auth?mode=forgot');
    await page.getByLabel('Email address', { exact: true }).fill(email);
    const response = page.waitForResponse(r => r.url().includes('/auth/v1/recover') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Send reset link', exact: true }).click();
    const recovery = await response;
    expect(recovery.ok(), 'Recovery email request must be accepted by Supabase').toBe(true);
    await expect(page.getByRole('status')).toContainText('a password reset link has been sent');
  });
  test('password reset changes the password with a real recovery session', async ({ page, baseURL }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('status')).toContainText('Open the password recovery link');
    await expect(page.getByLabel('New password', { exact: true })).toHaveCount(0);
    // Real one-time token, but no inbox needed: email delivery is NOT verified.
    const link = await admin.auth.admin.generateLink({ type: 'recovery', email });
    if (link.error) throw new Error('Unable to generate an isolated recovery token.');
    const session = await publicClient.auth.verifyOtp({ type: 'recovery', token_hash: link.data.properties.hashed_token });
    if (session.error || !session.data.session) throw new Error('Recovery token verification failed.');
    const origin = new URL(baseURL || 'http://localhost:8080').origin;
    const url = new URL('/reset-password', origin);
    url.hash = new URLSearchParams({ access_token: session.data.session.access_token, refresh_token: session.data.session.refresh_token, token_type: 'bearer', type: 'recovery', expires_in: '3600' }).toString();
    // Only this app origin gets the recovery session. evaluate keeps the secret
    // URL out of navigation failure messages, unlike a token-bearing goto().
    await page.goto('/');
    await page.evaluate(target => { window.location.href = target; }, url.href);
    const nextPassword = `Rigor-${randomUUID()}-8!`;
    await page.getByLabel('New password', { exact: true }).fill(nextPassword);
    await page.getByLabel('Confirm new password', { exact: true }).fill('mismatched-password');
    await page.getByRole('button', { name: 'Update password', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Passwords do not match');
    await page.getByLabel('Confirm new password', { exact: true }).fill(nextPassword);
    await page.getByRole('button', { name: 'Update password', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Password updated.');
    const oldLogin = await publicClient.auth.signInWithPassword({ email, password });
    expect(oldLogin.data.session === null, 'Old password must no longer grant access').toBe(true);
    password = nextPassword;
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await signIn(page);
  });
  test('private pages require sign-in and read only the signed-in customer workspace', async ({ page }) => {
    for (const path of paths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/auth\?mode=login$/);
    }
    await signIn(page);
    for (const path of paths.filter(path => path !== '/admin')) {
      await page.goto(path);
      await expect.poll(() => new URL(page.url()).pathname).toBe(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    }
    await page.goto('/settings');
    expect(await page.getByLabel('Email address', { exact: true }).inputValue() === email,
      'Profile must belong to the signed-in account').toBe(true);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Platform overview.' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: "This page didn't load" })).toBeVisible();
  });
});