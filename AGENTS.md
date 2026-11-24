<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Use TanStack content routes and a client-only authenticated layout; public marketing pages remain shareable and private loaders run after validated sign-in.
- Keep privileged operations inside authenticated server handlers and verify admin roles before loading the service client; RLS is the independent data boundary.
- Store roles separately from editable profiles; execution and payment records are server-write-only to prevent fabricated results.
- Keep server functions in `src/lib/platform.functions.ts` and shared workspace query options separate; page loaders preload the same query used by workspace views.
- Unconfigured external services must expose configuration-required states rather than simulated execution, connection or payment success.
- Run auth browser checks against real Supabase with unique disposable customer accounts; credentials stay in the test runner and cleanup never touches existing accounts.
- Disable traces, videos and automatic screenshots in auth tests because recovery URLs and entered credentials are secret.
- Website-wide admin reads and record changes use role-verified server handlers; elevated access is additive and administrators cannot disable themselves or other administrators to prevent lockout.
- Mount fresh forms for registration/login/recovery modes, use POST for credential forms, and enable submission only after hydration so state stays isolated and passwords never enter URLs.
- Compute administrator plan access from server-read roles separately from subscription/payment records, so all-plan privileges never fabricate a paid entitlement.
- Public footer settings load through a public-read query; administrator settings updates use user-scoped access and a database trigger atomically records immutable actor snapshots and before/after values.
- Keep RLS account-status helpers in an unexposed application schema; combine owner/active-account policies with column grants so editable profiles and notifications cannot alter protected status or system fields.
- Preserve only a recovery UI hint before bearer middleware consumes the callback hash; validate the live user, keep tokens out of storage/artifacts, and clear the hint on completion or sign-out.
- Keep known integration brand artwork in a static provider-to-asset map; CDN asset pointers avoid runtime logo lookup credentials.
