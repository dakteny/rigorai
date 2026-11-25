import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Bot,
  Globe,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  Users,
  Workflow,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace";
import { AdminWebsiteSettings, AdminWebsiteAudit } from "@/components/admin-website-settings";
import { websiteSettingsOptions, websiteAuditOptions } from "@/lib/website-settings-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  adminData,
  setAccountState,
  adminSaveRecord,
  grantAdminRole,
} from "@/lib/platform.functions";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
import type { Tables } from "@/integrations/supabase/types";

const options = queryOptions({ queryKey: ["admin"], queryFn: () => adminData() });
const tabs = [
  "Users",
  "Workflows",
  "AI Agents",
  "Messages",
  "Executions",
  "Integrations",
  "Billing",
  "Activity",
  "Website",
  "Website Settings",
  "Audit Log",
] as const;
type Tab = (typeof tabs)[number];
type Edit =
  | { kind: "workflow"; record: Tables<"automations"> }
  | { kind: "agent"; record: Tables<"ai_agents"> };
const sitePages = [
  { to: "/", name: "Home" },
  { to: "/services", name: "Services" },
  { to: "/about", name: "About" },
  { to: "/pricing", name: "Pricing" },
  { to: "/contact", name: "Contact" },
] as const;
const workspacePages = [
  { to: "/dashboard", name: "Overview" },
  { to: "/automations", name: "Automations" },
  { to: "/agents", name: "AI Agents" },
  { to: "/integrations", name: "Integrations" },
  { to: "/templates", name: "Templates" },
  { to: "/analytics", name: "Analytics" },
  { to: "/activity", name: "Activity" },
  { to: "/billing", name: "Billing" },
  { to: "/settings", name: "Settings" },
  { to: "/support", name: "Support" },
] as const;
export const Route = createFileRoute("/_authenticated/admin")({
  head: () =>
    pageHead(
      "Administration",
      "Manage Rigor AI accounts, workflows, AI agents, enquiries and verified website-wide activity.",
    ),
  loader: async ({ context }) => {
    const data = await context.queryClient.ensureQueryData(workspaceOptions);
    if (data.roles.some((r) => r.role === "admin"))
      await Promise.all([
        context.queryClient.ensureQueryData(options),
        context.queryClient.ensureQueryData(websiteSettingsOptions),
        context.queryClient.ensureQueryData(websiteAuditOptions),
      ]);
  },
  component: AdminAccess,
});
function AdminAccess() {
  const { data } = useSuspenseQuery(workspaceOptions);
  if (!data.roles.some((r) => r.role === "admin"))
    return (
      <WorkspaceShell title="Administration">
        <Shield className="text-electric mb-5" size={32} />
        <h1 className="text-2xl font-bold">Access restricted</h1>
        <p className="text-sm text-muted-foreground mt-3 mb-6">
          Only verified administrators can access this area.
        </p>
        <Button asChild variant="outline">
          <Link to="/dashboard">Return to workspace</Link>
        </Button>
      </WorkspaceShell>
    );
  return <Admin />;
}
function Admin() {
  const { data } = useSuspenseQuery(options);
  const { data: websiteAudit } = useSuspenseQuery(websiteAuditOptions);
  const { data: account } = useSuspenseQuery(workspaceOptions);
  const [tab, setTab] = useState<Tab>("Users");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<Edit | null>(null);
  const [confirm, setConfirm] = useState<{
    user: Tables<"profiles">;
    action: "disable" | "enable" | "admin" | "staff";
  } | null>(null);
  const change = useServerFn(setAccountState);
  const save = useServerFn(adminSaveRecord);
  const grant = useServerFn(grantAdminRole);
  const query = useQueryClient();
  const matches = (...values: (string | null)[]) =>
    values.some((value) => value?.toLowerCase().includes(search.toLowerCase()));
  const owner = (id: string) => {
    const user = data.users.find((u) => u.id === id);
    return user?.email || id;
  };
  const roles = (id: string) => data.roles.filter((r) => r.user_id === id).map((r) => r.role);
  async function refresh() {
    await Promise.all([
      query.invalidateQueries({ queryKey: ["admin"] }),
      query.invalidateQueries({ queryKey: ["workspace"] }),
      query.invalidateQueries({ queryKey: websiteSettingsOptions.queryKey }),
      query.invalidateQueries({ queryKey: websiteAuditOptions.queryKey }),
    ]);
  }
  async function perform(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await action();
      await refresh();
      toast.success(success);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save changes");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edit) return;
    const form = new FormData(e.currentTarget);
    const status = String(form.get("status"));
    if (status !== "draft" && status !== "active" && status !== "paused" && status !== "inactive")
      return;
    const ok = await perform(
      () =>
        save({
          data: {
            id: edit.record.id,
            kind: edit.kind,
            name: String(form.get("name")),
            description: String(form.get("description")),
            status,
            ...(edit.kind === "agent" ? { instructions: String(form.get("instructions")) } : {}),
          },
        }),
      "Configuration saved.",
    );
    if (ok) setEdit(null);
  }
  const visibleUsers = data.users.filter((u) => matches(u.email, u.full_name));
  const workflows = data.automations.filter((w) => matches(w.name, owner(w.user_id)));
  const agents = data.agents.filter((a) => matches(a.name, owner(a.user_id)));
  const messages = data.contacts.filter((m) => matches(m.name, m.email, m.message, m.service));
  const executions = data.executions.filter((e) =>
    matches(e.execution_status, owner(e.user_id), e.automation_id),
  );
  const integrations = data.integrations.filter((i) => matches(i.provider, owner(i.user_id)));
  const subscriptions = data.subscriptions.filter((s) => matches(s.plan, owner(s.user_id)));
  const activity = data.activity.filter((a) => matches(a.description, owner(a.user_id)));
  const count = {
    Users: visibleUsers.length,
    Workflows: workflows.length,
    "AI Agents": agents.length,
    Messages: messages.length,
    Executions: executions.length,
    Integrations: integrations.length,
    Billing: subscriptions.length,
    Activity: activity.length,
    Website: sitePages.length + workspacePages.length,
    "Website Settings": 6,
    "Audit Log": websiteAudit.filter((entry) =>
      `${entry.actor_name} ${entry.actor_email} ${JSON.stringify(entry.changes)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ).length,
  }[tab];
  return (
    <WorkspaceShell title="Administration">
      <div className="flex flex-wrap justify-between items-start gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-success mb-3">
            <Shield size={14} />
            Administrator · Full platform access
          </div>
          <h1 className="text-2xl font-bold">Platform overview.</h1>
        </div>
        <Button asChild variant="outline">
          <Link to="/">
            <Globe />
            Visit website
            <ArrowUpRight />
          </Link>
        </Button>
      </div>
      <div className="metric-grid">
        {[
          ["Accounts", data.users.length, Users],
          ["Workflows", data.automations.length, Workflow],
          ["AI Agents", data.agents.length, Bot],
          ["Enquiries", data.contacts.length, Mail],
        ].map(([label, value, Icon]) => {
          const I = Icon as typeof Users;
          return (
            <div className="metric" key={String(label)}>
              <div className="flex justify-between items-center text-muted-foreground text-xs">
                <span>{String(label)}</span>
                <I size={16} />
              </div>
              <strong>{String(value)}</strong>
            </div>
          );
        })}
      </div>
      <div
        role="tablist"
        aria-label="Administration sections"
        className="flex overflow-x-auto gap-1 border-b border-border pb-3"
      >
        {tabs.map((t) => (
          <Button
            role="tab"
            aria-selected={tab === t}
            aria-controls="admin-panel"
            variant={tab === t ? "secondary" : "ghost"}
            className="shrink-0"
            key={t}
            onClick={() => {
              setTab(t);
              setSearch("");
            }}
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap justify-between items-center gap-3 py-5">
        <h2 className="text-sm font-semibold">
          {tab} <span className="ml-2 text-muted-foreground font-normal">{count}</span>
        </h2>
        <div className="flex items-center gap-2 min-w-0">
          {tab !== "Website" && tab !== "Website Settings" && (
            <label className="flex items-center gap-2 border border-input rounded-md px-3 h-9 min-w-0">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                aria-label={`Search ${tab.toLowerCase()}`}
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-xs outline-none w-36 sm:w-48 min-w-0"
              />
            </label>
          )}
          <Button
            variant="outline"
            size="icon"
            title="Refresh records"
            aria-label="Refresh records"
            disabled={busy}
            onClick={() => perform(refresh, "Records refreshed.")}
          >
            <RefreshCw />
          </Button>
        </div>
      </div>
      <section id="admin-panel" role="tabpanel" aria-label={tab}>
        {tab === "Website Settings" && <AdminWebsiteSettings />}
        {tab === "Audit Log" && <AdminWebsiteAudit search={search} />}
        {tab === "Users" &&
          visibleUsers.map((u) => {
            const userRoles = roles(u.id);
            const protectedAccount = u.id === account.profile.id || userRoles.includes("admin");
            return (
              <article className="data-row" key={u.id}>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium">
                    {u.full_name || "Unnamed account"}
                    {u.id === account.profile.id && (
                      <span className="text-electric text-xs ml-2">You</span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 break-all">{u.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`status ${u.disabled ? "failed" : "active"}`}>
                      {u.disabled ? "Disabled" : "Enabled"}
                    </span>
                    {userRoles.map((role) => (
                      <span key={role} className="text-xs capitalize text-muted-foreground">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!u.disabled && !userRoles.includes("admin") && u.id !== account.profile.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirm({ user: u, action: "admin" })}
                    >
                      <Shield />
                      Grant admin
                    </Button>
                  )}
                  {!u.disabled &&
                    !userRoles.includes("staff") &&
                    !userRoles.includes("admin") &&
                    u.id !== account.profile.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirm({ user: u, action: "staff" })}
                      >
                        Grant staff
                      </Button>
                    )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={protectedAccount || busy}
                    title={protectedAccount ? "Administrator accounts are protected" : undefined}
                    onClick={() =>
                      setConfirm({ user: u, action: u.disabled ? "enable" : "disable" })
                    }
                  >
                    {u.disabled ? "Enable account" : "Disable account"}
                  </Button>
                </div>
              </article>
            );
          })}
        {tab === "Workflows" &&
          workflows.map((w) => (
            <article className="data-row" key={w.id}>
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{w.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 break-all">{owner(w.user_id)}</p>
                <p className="text-xs text-muted-foreground mt-2">{w.category}</p>
              </div>
              <div className="flex gap-3 items-center">
                <span className={`status ${w.status}`}>{w.status}</span>
                <Button
                  variant="outline"
                  size="icon"
                  title={`Edit ${w.name}`}
                  aria-label={`Edit ${w.name}`}
                  onClick={() => setEdit({ kind: "workflow", record: w })}
                >
                  <Pencil />
                </Button>
              </div>
            </article>
          ))}
        {tab === "AI Agents" &&
          agents.map((a) => (
            <article className="data-row" key={a.id}>
              <div className="min-w-0">
                <h3 className="text-sm font-medium">{a.name}</h3>
                <p className="text-xs text-muted-foreground mt-2 break-all">{owner(a.user_id)}</p>
                <p className="text-xs text-muted-foreground mt-2">{a.model}</p>
              </div>
              <div className="flex gap-3 items-center">
                <span className={`status ${a.status}`}>{a.status}</span>
                <Button
                  variant="outline"
                  size="icon"
                  title={`Edit ${a.name}`}
                  aria-label={`Edit ${a.name}`}
                  onClick={() => setEdit({ kind: "agent", record: a })}
                >
                  <Pencil />
                </Button>
              </div>
            </article>
          ))}
        {tab === "Messages" &&
          messages.map((c) => (
            <article key={c.id} className="border-b border-border py-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold">
                    {c.name} · {c.service}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 break-all">
                    {c.email}
                    {c.company && ` · ${c.company}`}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`mailto:${encodeURIComponent(c.email)}?subject=${encodeURIComponent(`Re: ${c.service}`)}`}
                  >
                    <Mail />
                    Reply
                  </a>
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words mt-4">{c.message}</p>
              <p className="text-xs text-muted-foreground mt-3">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </article>
          ))}
        {tab === "Executions" &&
          executions.map((e) => (
            <article className="data-row" key={e.id}>
              <div className="min-w-0">
                <h3 className="text-sm font-medium">
                  {data.automations.find((w) => w.id === e.automation_id)?.name || e.automation_id}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 break-all">{owner(e.user_id)}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(e.started_at).toLocaleString()}
                </p>
                {e.error_message && (
                  <p className="text-xs text-destructive mt-2 break-words">{e.error_message}</p>
                )}
              </div>
              <span className={`status ${e.execution_status}`}>{e.execution_status}</span>
            </article>
          ))}
        {tab === "Integrations" &&
          integrations.map((i) => (
            <article className="data-row" key={i.id}>
              <div className="min-w-0">
                <h3 className="text-sm font-medium capitalize">{i.provider}</h3>
                <p className="text-xs text-muted-foreground mt-2 break-all">{owner(i.user_id)}</p>
              </div>
              <span className={`status ${i.connection_status === "connected" ? "active" : ""}`}>
                {i.connection_status}
              </span>
            </article>
          ))}
        {tab === "Billing" && (
          <>
            <div className="border-y border-border py-4 mb-2 text-xs text-muted-foreground">
              Payment collection: configuration required
            </div>
            {subscriptions.map((s) => (
              <article className="data-row" key={s.id}>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium capitalize">{s.plan} plan</h3>
                  <p className="text-xs text-muted-foreground mt-2 break-all">{owner(s.user_id)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {s.payment_provider || "No payment provider"}
                  </p>
                </div>
                <span className={`status ${s.subscription_status}`}>{s.subscription_status}</span>
              </article>
            ))}
          </>
        )}
        {tab === "Activity" &&
          activity.map((a) => (
            <article className="data-row" key={a.id}>
              <div className="min-w-0">
                <p className="text-xs break-words">{a.description}</p>
                <p className="text-xs text-muted-foreground mt-2 break-all">{owner(a.user_id)}</p>
              </div>
              <time className="text-xs text-muted-foreground shrink-0">
                {new Date(a.created_at).toLocaleString()}
              </time>
            </article>
          ))}
        {tab === "Website" && (
          <>
            <h3 className="text-xs uppercase text-muted-foreground py-3">Public website</h3>
            <div className="grid sm:grid-cols-2 gap-x-8">
              {sitePages.map((p) => (
                <Link className="data-row text-sm" to={p.to} key={p.to}>
                  <span className="flex gap-3 items-center">
                    <Globe size={16} className="text-electric" />
                    {p.name}
                  </span>
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
            <h3 className="text-xs uppercase text-muted-foreground mt-8 py-3">Your workspace</h3>
            <div className="grid sm:grid-cols-2 gap-x-8">
              {workspacePages.map((p) => (
                <Link className="data-row text-sm" to={p.to} key={p.to}>
                  {p.name}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          </>
        )}
        {count === 0 && tab !== "Audit Log" && (
          <div className="py-14 text-center text-sm text-muted-foreground">
            {search ? "No matching records." : "No records yet."}
          </div>
        )}
        {tab !== "Website" && tab !== "Website Settings" && (
          <p className="text-xs text-muted-foreground pt-6">
            Latest records · Up to{" "}
            {tab === "Messages" || tab === "Activity" || tab === "Audit Log" ? "100" : "500"} shown
          </p>
        )}
      </section>
      <Dialog
        open={edit !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setEdit(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {edit?.kind === "agent" ? "AI agent" : "workflow"}</DialogTitle>
            <DialogDescription>{edit ? owner(edit.record.user_id) : ""}</DialogDescription>
          </DialogHeader>
          {edit && (
            <form onSubmit={submit} className="space-y-4" key={edit.record.id}>
              <label className="form-field">
                Name
                <input
                  className="field-control"
                  name="name"
                  defaultValue={edit.record.name}
                  required
                  maxLength={120}
                />
              </label>
              <label className="form-field">
                Description
                <textarea
                  className="field-control"
                  name="description"
                  defaultValue={edit.record.description}
                  maxLength={2000}
                  rows={3}
                />
              </label>
              {edit.kind === "agent" && (
                <label className="form-field">
                  Instructions
                  <textarea
                    className="field-control"
                    name="instructions"
                    defaultValue={edit.record.instructions}
                    required
                    maxLength={12000}
                    rows={5}
                  />
                </label>
              )}
              <label className="form-field">
                Configuration status
                <select className="field-control" name="status" defaultValue={edit.record.status}>
                  {(edit.kind === "agent"
                    ? ["active", "inactive"]
                    : ["draft", "active", "paused"]
                  ).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {edit.kind === "workflow" && (
                <p className="text-xs text-muted-foreground">Execution: not connected</p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEdit(null)}
                >
                  Cancel
                </Button>
                <Button variant="brand" disabled={busy} type="submit">
                  {busy ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === "admin" || confirm?.action === "staff"
                ? `Grant ${confirm.action} access?`
                : `${confirm?.action === "enable" ? "Enable" : "Disable"} account?`}
            </DialogTitle>
            <DialogDescription>{confirm?.user.email}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirm?.action === "admin"
              ? "This account will have full access to all accounts, workflows, AI agents and private platform records."
              : confirm?.action === "staff"
                ? "Staff access will be added. Website-wide administration remains restricted to administrators."
                : confirm?.action === "disable"
                  ? "This account will no longer be able to use the private workspace."
                  : "This account will regain access to its private workspace."}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant={confirm?.action === "disable" ? "destructive" : "brand"}
              disabled={busy}
              onClick={async () => {
                if (!confirm) return;
                const target = confirm;
                const ok = await perform(
                  () =>
                    target.action === "admin" || target.action === "staff"
                      ? grant({ data: { id: target.user.id, role: target.action } })
                      : change({
                          data: { id: target.user.id, disabled: target.action === "disable" },
                        }),
                  "Account access updated.",
                );
                if (ok) setConfirm(null);
              }}
            >
              {busy ? "Updating…" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
