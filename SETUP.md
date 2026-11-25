# Rigor AI setup and readiness

## Implemented

Public home, about, services, pricing, and persisted contact enquiries. Supabase email/password account screens, email-confirmation state, password recovery, private profiles and avatar storage. Private dashboard, workflow CRUD and visual trigger/action configuration, template drafts, AI agent CRUD, live server-side model testing and persisted conversation history. Activity, notifications, execution-derived analytics, billing readiness and administrator-only account/enquiry/monitoring screens.

## Account configuration

This app uses your connected external Supabase project. In Supabase Authentication, enable email/password sign-in and configure the site URL and allowed redirect URLs for every app origin:

- Preview: `https://id-preview--aff5aeb7-7c82-40e2-aab6-8df3bfbcffec.lovable.app`
- Add the published app URL after publication.
- For each origin allow `/` for confirmation and `/reset-password` for recovery.
  Keep email confirmation enabled. Test email delivery and recovery links outside the editor. Configure a production email sender. Leaked-password protection is disabled in the existing project; enable it before launch.

## Roles and permissions

New accounts automatically receive customer permission. Roles live in protected `user_roles`, not editable profile metadata. Assign the first administrator using a trusted Supabase administration operation after identifying the account UUID; never add public role-selection controls. Staff currently have no additional privileges beyond their own records. Administrators can review accounts, messages, execution results and audit activity, and enable/disable application account access.
Verified administrators have access across Free, Pro, and Business without purchasing a subscription. This does not create a paid subscription or configure unavailable external services.
All public-schema tables have row-level access rules. Active customers can access their own private records; disabled customers cannot regain access by rewriting their profile. Editable profile columns are limited to name, avatar, and preferences; notifications permit only marking read. Roles, payment records, execution results, integrations, and audit records are not client-writable. Public contact settings remain readable, with administrator-only updates.

## Website settings and audit history

Administration includes Website Settings for the existing footer founder, location, website, email, phone, and tagline. Each actual change atomically records the administrator's name/email, timestamp, and previous/new values. Audit Log shows the latest 100 changes and supports searching by actor and changed values. Audit records retain the actor snapshot if that account is deleted. Re-saving unchanged settings creates no false change record. Concurrent stale edits are rejected rather than overwriting another administrator's update.

## Runtime environment

Browser configuration: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (managed by the existing integration).
Server configuration: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`.
Never use server credentials in browser code. AI requests use the Lovable AI Gateway, with `openai/gpt-6-astra`, not a browser OpenAI key. Usage is subject to workspace availability and credits.


## External-service blockers

- **End-user integrations:** marketplace and disconnected states are present; per-user provider authorization, refresh/revocation and callback handling are not configured. Never reuse a workspace owner's connection as a customer's personal account.
- **Stripe:** checkout, billing portal and verified subscription webhooks need payment configuration plus confirmed prices and entitlements. Paid tiers cannot be purchased and are never marked paid from a UI action.
- **Limits:** custom shared request limiting was deferred by the owner for deployment review. Review abuse protection for the public contact endpoint and AI requests before launch.
- **Admin services and plan editing:** not enabled until publishable service/plan policies, prices and entitlements are supplied.
- **Testimonials:** not fabricated; supply approved customer testimonials to add them.

## Verification

Validation/integrity tests and route tests live under `src/test/`. Run `bunx vitest run` for the suite.

Real authentication browser checks live in `e2e/auth.spec.ts`. Run `bun run test:e2e` against the running app (default `http://localhost:8080`; override with `E2E_BASE_URL`). Use `bunx playwright install chromium` on a new development machine if Chromium is not installed. The test runner needs the server-only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from a secure environment. Do not put these values in source or browser settings.

The suite creates unique disposable accounts for each check and deletes them afterward. It uses real Supabase requests, not mocked authentication. The full desktop and 479×515 mobile suite passed 14 checks for login, isolated registration/login forms, session persistence, logout, recovery-password replacement, private-page protection, administrator changes, all-plan administrator access, settings audit history and two-customer row-level isolation. All 17 unit tests passed. Four signup/recovery-email checks were skipped because no approved test inbox was supplied.

Sign-up and recovery-email request checks are implemented but skipped until `E2E_EMAIL_ADDRESS` is set to a test inbox you control. This address must support plus addressing; every test uses a unique alias to avoid changing an existing account. These checks send real email. The provider rejects example.com public sign-ups. Do not substitute a stranger's address or mock a successful response. The password-update test uses a real one-time recovery token generated by the test runner and does not verify inbox delivery or a delivered email's redirect configuration.

Hosted settings were read: email sign-in is enabled, signup is enabled, and automatic email confirmation is off. No hosted auth settings were changed. Sign-up tests verify the no-session confirmation state and customer-profile creation; only their own test account is confirmed by the test runner.
The registration, login and recovery forms reset when switching between them. After a new user confirms their email, they can log in using the email and password entered at registration. The signup check also verifies login and workspace persistence after the isolated account is confirmed; real inbox delivery still requires an approved inbox.
Credential forms use POST and login/signup submission waits for hydration. Recovery intent is preserved before public initial reads initialize Supabase Auth; the flag contains no tokens or permissions, the live user is validated, and the flag is cleared after completion or sign-out.

Traces, videos and automatic screenshots are disabled to avoid saving credentials or recovery URLs. Reports go under `/tmp/browser/rigor-auth-e2e/`. Keep failure output private. `e2e/website-admin.spec.ts` covers all-plan admin access, real settings changes, public footer read-back, audit actor/time/diffs, no-op saves, and rejection of customer audit writes. `e2e/rls.spec.ts` verifies two-customer isolation, ownership-transfer denial, restricted profile/system writes, and disabled-account protection against the real database. Delivered-email confirmation/recovery and live AI verification remain separate launch checks.


The platform is not production-ready until the outstanding configuration, abuse protection, and authenticated end-to-end checks are completed.
