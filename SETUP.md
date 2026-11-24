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

## Runtime environment
Browser configuration: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (managed by the existing integration).
Server configuration: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`.
Never use server credentials in browser code. AI requests use the Lovable AI Gateway, with `openai/gpt-6-astra`, not a browser OpenAI key. Usage is subject to workspace availability and credits.

## External-service blockers
- **n8n:** the connection was declined. Workflow configurations can be saved, activated and paused, but are not executed. Next step: connect n8n, discover its real workflow/webhook IDs, map configurations, and implement signed result callbacks and durable execution tracking. There is intentionally no endpoint pretending to run unavailable workflows.
- **End-user integrations:** marketplace and disconnected states are present; per-user provider authorization, refresh/revocation and callback handling are not configured. Never reuse a workspace owner's connection as a customer's personal account.
- **Stripe:** checkout, billing portal and verified subscription webhooks need payment configuration plus confirmed prices and entitlements. Paid tiers cannot be purchased and are never marked paid from a UI action.
- **Limits:** custom shared request limiting was deferred by the owner for deployment review. Review abuse protection for the public contact endpoint and AI requests before launch.
- **Admin services and plan editing:** not enabled until publishable service/plan policies, prices and entitlements are supplied.
- **Testimonials:** not fabricated; supply approved customer testimonials to add them.

## Verification
Validation/integrity tests and route tests live under `src/test/`. Run `bunx vitest run` for the suite. Confirm signed-in workflow CRUD, two-account isolation, admin-only operations, email confirmation/recovery, and real AI replies on the configured external Supabase account before launch. Signed-in checks could not be restored from the sandbox's unmanaged external session.

The platform is not production-ready until the outstanding configuration, abuse protection, and authenticated end-to-end checks are completed.