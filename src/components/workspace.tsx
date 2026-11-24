import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import {
  LayoutDashboard,
  Workflow,
  Bot,
  Plug,
  LayoutTemplate,
  History,
  ChartNoAxesCombined,
  CreditCard,
  Settings,
  LifeBuoy,
  LogOut,
  Plus,
  ArrowUpRight,
  Bell,
  Menu,
  X,
  Play,
  Pause,
  Pencil,
  Trash2,
  GitBranch,
  Zap,
  ArrowRight,
  Search,
  Check,
  Shield,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Brand } from "./site";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { workspaceOptions } from "@/lib/workspace-query";
import {
  saveWorkflow,
  deleteWorkflow,
  saveAgent,
  deleteAgent,
  testAgent,
  updateProfile,
  readNotification,
} from "@/lib/platform.functions";
import { providers, templates } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
const nav = [
  { to: "/dashboard", name: "Overview", icon: LayoutDashboard },
  { to: "/automations", name: "My Automations", icon: Workflow },
  { to: "/agents", name: "AI Agents", icon: Bot },
  { to: "/integrations", name: "Integrations", icon: Plug },
  { to: "/templates", name: "Workflow Templates", icon: LayoutTemplate },
  { to: "/activity", name: "Activity Logs", icon: History },
  { to: "/analytics", name: "Analytics", icon: ChartNoAxesCombined },
  { to: "/billing", name: "Billing & Subscription", icon: CreditCard },
  { to: "/settings", name: "Settings", icon: Settings },
  { to: "/support", name: "Help & Support", icon: LifeBuoy },
] as const;
export function WorkspaceShell({ title, children }: { title: string; children: ReactNode }) {
  const { data } = useSuspenseQuery(workspaceOptions);
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const query = useQueryClient();
  const navigate = useNavigate();
  const read = useServerFn(readNotification);
  async function logout() {
    await query.cancelQueries();
    query.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { mode: "login" }, replace: true });
  }
  return (
    <div className={`dashboard ${menu ? "menu-open" : ""}`}>
      <aside className="dash-sidebar">
        <div className="flex justify-between items-center">
          <Brand />
          <Button
            className="mobile-nav"
            variant="ghost"
            size="icon"
            aria-label="Close sidebar"
            onClick={() => setMenu(false)}
          >
            <X />
          </Button>
        </div>
        <p className="text-[10px] uppercase text-muted-foreground mt-10 mb-3 px-3">Workspace</p>
        <nav className="flex-1">
          {nav.map((n) => (
            <Link
              to={n.to}
              key={n.to}
              className="dash-link"
              activeOptions={{ exact: true }}
              onClick={() => setMenu(false)}
            >
              <n.icon size={17} />
              {n.name}
            </Link>
          ))}
          {data.roles.some((r) => r.role === "admin") && (
            <Link to="/admin" className="dash-link">
              <Shield size={17} />
              Administration
            </Link>
          )}
        </nav>
        <div className="mt-10 border-t border-border pt-5">
          <div className="flex items-center gap-3 px-3">
            <span className="size-8 bg-accent rounded-full grid place-items-center text-electric text-xs font-bold">
              {data.profile.full_name.slice(0, 2).toUpperCase() || "RA"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {data.profile.full_name || "Your account"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 capitalize">
                {data.subscription?.plan ?? "Free"} plan
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start mt-4 text-muted-foreground"
            onClick={logout}
          >
            <LogOut />
            Log out
          </Button>
        </div>
      </aside>
      <div className="dash-main">
        <header className="dash-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="mobile-nav"
              aria-label="Open sidebar"
              onClick={() => setMenu(true)}
            >
              <Menu />
            </Button>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden sm:flex text-xs text-muted-foreground items-center gap-2"
            >
              Visit website <ArrowUpRight size={13} />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              className="relative"
              onClick={() => setNotifications(true)}
            >
              <Bell />
              {data.notifications.some((n) => !n.is_read) && (
                <span className="absolute right-2 top-2 size-1.5 rounded-full bg-electric" />
              )}
            </Button>
            <span className="size-8 rounded-full bg-accent text-electric flex items-center justify-center text-xs font-semibold">
              {data.profile.full_name.slice(0, 1) || "R"}
            </span>
          </div>
        </header>
        <main className="dash-content">{children}</main>
      </div>
      <Dialog open={notifications} onOpenChange={setNotifications}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notifications</DialogTitle>
            <DialogDescription>Recent updates from your workspace.</DialogDescription>
          </DialogHeader>
          {data.notifications.length === 0 ? (
            <p className="section-copy py-6">You're all caught up.</p>
          ) : (
            data.notifications.map((n) => (
              <div className="data-row" key={n.id}>
                <div>
                  <h3 className="text-sm font-medium">{n.title}</h3>
                  <p className="text-xs text-muted-foreground mt-2">{n.message}</p>
                </div>
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Mark notification as read"
                    onClick={async () => {
                      await read({ data: { id: n.id } });
                      await query.invalidateQueries({ queryKey: ["workspace"] });
                    }}
                  >
                    <Check />
                  </Button>
                )}
              </div>
            ))
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export function Empty({
  icon: Icon = Workflow,
  title,
  description,
  children,
}: {
  icon?: typeof Workflow;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon size={30} className="text-electric" />
      <h2 className="text-base text-foreground font-semibold">{title}</h2>
      <p className="text-xs max-w-sm leading-6">{description}</p>
      {children}
    </div>
  );
}
function Heading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap justify-between items-center gap-5">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-xs text-muted-foreground mt-3 leading-6">{description}</p>
      </div>
      {action}
    </div>
  );
}
function Metrics() {
  const { data } = useSuspenseQuery(workspaceOptions);
  return (
    <div className="metric-grid">
      {[
        ["Total workflows", data.automations.length, Workflow],
        ["Active automations", data.automations.filter((a) => a.status === "active").length, Zap],
        [
          "Completed tasks",
          data.executions.filter((e) => e.execution_status === "completed").length,
          Check,
        ],
        [
          "Failed automations",
          data.executions.filter((e) => e.execution_status === "failed").length,
          History,
        ],
      ].map(([label, value, Icon]) => {
        const I = Icon as typeof Workflow;
        return (
          <div className="metric" key={String(label)}>
            <div className="flex justify-between gap-2 text-xs text-muted-foreground">
              <span>{String(label)}</span>
              <I size={16} />
            </div>
            <strong>{String(value)}</strong>
          </div>
        );
      })}
    </div>
  );
}
export function Overview() {
  const { data } = useSuspenseQuery(workspaceOptions);
  return (
    <WorkspaceShell title="Overview">
      <Heading
        title={`Welcome${data.profile.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}.`}
        description="A little less busywork. A little more possibility."
        action={
          <Button variant="brand" asChild>
            <Link to="/automations">
              <Plus />
              Create automation
            </Link>
          </Button>
        }
      />
      <Metrics />
      <div className="grid lg:grid-cols-3 gap-8 mt-9">
        <section className="lg:col-span-2">
          <h2 className="text-sm font-semibold mb-5">Recent automations</h2>
          {!data.automations.length ? (
            <Empty
              title="Your first workflow starts here."
              description="Configure a trigger and an action to create your first automation."
            >
              <Button variant="outline" asChild>
                <Link to="/templates">
                  Browse templates <ArrowRight />
                </Link>
              </Button>
            </Empty>
          ) : (
            data.automations.slice(0, 5).map((a) => (
              <Link to="/automations" className="data-row" key={a.id}>
                <div className="flex gap-3 items-center">
                  <span className="service-icon">
                    <Workflow size={18} />
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">{a.name}</h3>
                    <p className="text-xs text-muted-foreground mt-2">{a.category}</p>
                  </div>
                </div>
                <span className={`status ${a.status}`}>{a.status}</span>
              </Link>
            ))
          )}
        </section>
        <section>
          <h2 className="text-sm font-semibold mb-5">Recent activity</h2>
          {!data.activities.length ? (
            <Empty
              icon={History}
              title="A clean slate."
              description="Workspace activity will appear here as you work."
            />
          ) : (
            data.activities.slice(0, 6).map((a) => (
              <div className="data-row" key={a.id}>
                <div>
                  <p className="text-xs">{a.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </section>
      </div>
      <section className="mt-10">
        <h2 className="text-sm font-semibold mb-5">Monthly execution usage</h2>
        <ExecutionChart />
      </section>
    </WorkspaceShell>
  );
}
function ExecutionChart() {
  const { data } = useSuspenseQuery(workspaceOptions);
  const month = new Date().toISOString().slice(0, 7);
  const completed = data.executions.filter(
    (e) => e.started_at.startsWith(month) && e.execution_status === "completed",
  );
  const failed = data.executions.filter(
    (e) => e.started_at.startsWith(month) && e.execution_status === "failed",
  );
  return (
    <div className="border-y border-border py-6 flex gap-10 flex-wrap">
      <div>
        <strong className="text-2xl text-success">{completed.length}</strong>
        <p className="text-xs text-muted-foreground mt-2">Completed this month</p>
      </div>
      <div>
        <strong className="text-2xl text-destructive">{failed.length}</strong>
        <p className="text-xs text-muted-foreground mt-2">Failed this month</p>
      </div>
      <div>
        <strong className="text-2xl text-electric">
          {completed.length + failed.length
            ? `${Math.round((completed.length / (completed.length + failed.length)) * 100)}%`
            : "—"}
        </strong>
        <p className="text-xs text-muted-foreground mt-2">Success rate</p>
      </div>
    </div>
  );
}
function Field({
  label,
  name,
  value,
  required = true,
  type = "text",
}: {
  label: string;
  name: string;
  value?: string | undefined;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="form-field">
      {label}
      <input
        className="field-control"
        name={name}
        defaultValue={value ?? ""}
        required={required}
        type={type}
        maxLength={120}
      />
    </label>
  );
}
export function Automations() {
  const { data } = useSuspenseQuery(workspaceOptions);
  const query = useQueryClient();
  const save = useServerFn(saveWorkflow);
  const remove = useServerFn(deleteWorkflow);
  const [editing, setEditing] = useState<Tables<"automations"> | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<Tables<"automations"> | null>(null);
  const [deleting, setDeleting] = useState<Tables<"automations"> | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await save({
        data: {
          ...(editing ? { id: editing.id } : {}),
          name: String(f.get("name")),
          description: String(f.get("description")),
          category: String(f.get("category")),
          trigger: String(f.get("trigger")),
          action: String(f.get("action")),
          status: "draft",
        },
      });
      setOpen(false);
      toast.success("Workflow configuration saved.");
      await query.invalidateQueries({ queryKey: ["workspace"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save workflow");
    } finally {
      setBusy(false);
    }
  }
  function configString(config: Tables<"automations">["trigger_config"]) {
    return config &&
      typeof config === "object" &&
      !Array.isArray(config) &&
      typeof config["type"] === "string"
      ? config["type"]
      : "Manual trigger";
  }
  async function status(a: Tables<"automations">) {
    try {
      await save({
        data: {
          id: a.id,
          name: a.name,
          description: a.description,
          category: a.category,
          trigger: configString(a.trigger_config),
          action: configString(a.action_config),
          status: a.status === "active" ? "paused" : "active",
        },
      });
      toast.success(
        a.status === "active"
          ? "Workflow paused."
          : "Configuration activated. Execution requires n8n connection.",
      );
      await query.invalidateQueries({ queryKey: ["workspace"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to change status");
    }
  }
  const visible = data.automations.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <WorkspaceShell title="My Automations">
      <Heading
        title="Make work flow."
        description="Your workflow configurations and verified execution history."
        action={
          <Button
            variant="brand"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus />
            Create automation
          </Button>
        }
      />
      <div className="relative mt-7 mb-5 max-w-sm">
        <Search size={16} className="absolute left-3 top-3 text-muted-foreground" />
        <input
          aria-label="Search automations"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-control pl-10"
          placeholder="Search automations…"
        />
      </div>
      {!visible.length ? (
        <Empty
          title={search ? "No matching workflows." : "Your next workflow starts here."}
          description="Start from scratch or choose a template. Saved configurations are not successful executions."
        >
          <Button variant="outline" asChild>
            <Link to="/templates">
              Browse templates <ArrowUpRight />
            </Link>
          </Button>
        </Empty>
      ) : (
        visible.map((a) => (
          <div className="data-row" key={a.id}>
            <div className="flex gap-4 items-center min-w-0">
              <span className="service-icon shrink-0">
                <Workflow size={19} />
              </span>
              <div>
                <h2 className="text-sm font-semibold break-words">{a.name}</h2>
                <p className="text-xs text-muted-foreground mt-2">
                  {a.category} · {data.executions.filter((e) => e.automation_id === a.id).length}{" "}
                  verified runs
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`status ${a.status}`}>{a.status}</span>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`View history for ${a.name}`}
                title="Execution history"
                onClick={() => setHistory(a)}
              >
                <History />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Edit ${a.name}`}
                title="Edit workflow"
                onClick={() => {
                  setEditing(a);
                  setOpen(true);
                }}
              >
                <Pencil />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${a.status === "active" ? "Pause" : "Activate"} ${a.name}`}
                title={a.status === "active" ? "Pause configuration" : "Activate configuration"}
                onClick={() => status(a)}
              >
                {a.status === "active" ? <Pause /> : <Play />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${a.name}`}
                title="Delete workflow"
                onClick={() => setDeleting(a)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))
      )}
      <p className="text-xs text-muted-foreground mt-6">
        Execution unavailable: n8n has not been connected.
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit automation" : "Create automation"}</DialogTitle>
            <DialogDescription>
              Define your workflow. Execution is available after n8n is connected.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <Field name="name" label="Workflow name" value={editing?.name} />
            <label className="form-field">
              Description
              <textarea
                name="description"
                maxLength={2000}
                className="field-control"
                defaultValue={editing?.description ?? ""}
                rows={2}
              />
            </label>
            <label className="form-field">
              Category
              <select
                name="category"
                defaultValue={editing?.category ?? "Business"}
                className="field-control"
              >
                {[
                  "Business",
                  "Customer support",
                  "Email",
                  "Sales",
                  "E-commerce",
                  "Social media",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="builder-flow">
              <div className="flow-node">
                <Zap className="text-electric mb-3" size={20} />
                <label className="form-field">
                  Trigger
                  <select
                    name="trigger"
                    className="field-control"
                    defaultValue={editing ? configString(editing.trigger_config) : "Manual trigger"}
                  >
                    {[
                      "Manual trigger",
                      "New customer",
                      "Contact form submitted",
                      "New order",
                      "New email",
                      "Scheduled reminder",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
              <ArrowRight size={18} className="text-muted-foreground shrink-0" />
              <div className="flow-node">
                <GitBranch className="text-violet mb-3" size={20} />
                <label className="form-field">
                  Action
                  <select
                    name="action"
                    className="field-control"
                    defaultValue={editing ? configString(editing.action_config) : "Send email"}
                  >
                    {[
                      "Send email",
                      "Send notification",
                      "Save contact",
                      "Categorize inquiry",
                      "Generate AI response",
                      "Synchronize records",
                    ].map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <Button variant="brand" disabled={busy}>
              {busy ? "Saving…" : "Save workflow"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!history}
        onOpenChange={(o) => {
          if (!o) setHistory(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Execution history</DialogTitle>
            <DialogDescription>{history?.name}</DialogDescription>
          </DialogHeader>
          {data.executions.filter((e) => e.automation_id === history?.id).length === 0 ? (
            <p className="section-copy py-6">
              No verified executions. Connect n8n to run this workflow.
            </p>
          ) : (
            data.executions
              .filter((e) => e.automation_id === history?.id)
              .map((e) => (
                <div key={e.id} className="data-row">
                  <div>
                    <span className={`status ${e.execution_status}`}>{e.execution_status}</span>
                    <p className="text-xs mt-3">{new Date(e.started_at).toLocaleString()}</p>
                    {e.error_message && (
                      <p className="text-xs text-destructive mt-2">{e.error_message}</p>
                    )}
                  </div>
                </div>
              ))
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this workflow?</DialogTitle>
            <DialogDescription>
              {deleting?.name} and its execution history will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!deleting) return;
              try {
                await remove({ data: { id: deleting.id } });
                setDeleting(null);
                await query.invalidateQueries({ queryKey: ["workspace"] });
                toast.success("Workflow deleted.");
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not delete workflow");
              }
            }}
          >
            Delete workflow
          </Button>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
export function Agents() {
  const { data } = useSuspenseQuery(workspaceOptions);
  const query = useQueryClient();
  const save = useServerFn(saveAgent);
  const test = useServerFn(testAgent);
  const remove = useServerFn(deleteAgent);
  const [editing, setEditing] = useState<Tables<"ai_agents"> | null>(null);
  const [open, setOpen] = useState(false);
  const [testing, setTesting] = useState<Tables<"ai_agents"> | null>(null);
  const [busy, setBusy] = useState(false);
  const [response, setResponse] = useState("");
  const [deleting, setDeleting] = useState<Tables<"ai_agents"> | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await save({
        data: {
          ...(editing ? { id: editing.id } : {}),
          name: String(f.get("name")),
          description: String(f.get("description")),
          instructions: String(f.get("instructions")),
          status: editing?.status === "active" ? "active" : "inactive",
        },
      });
      setOpen(false);
      toast.success("Agent saved.");
      await query.invalidateQueries({ queryKey: ["workspace"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save agent");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceShell title="AI Agents">
      <Heading
        title="Meet your AI teammates."
        description="Specialized intelligence, shaped around your business."
        action={
          <Button
            variant="brand"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus />
            Create agent
          </Button>
        }
      />
      {!data.agents.length ? (
        <div className="mt-8">
          <Empty
            icon={Bot}
            title="A new teammate is waiting."
            description="Create a customer support, sales, email, lead generation, or business assistant with your own instructions."
          />
        </div>
      ) : (
        <div className="service-grid">
          {data.agents.map((a) => (
            <article className="service-card" key={a.id}>
              <div className="flex justify-between">
                <span className="service-icon">
                  <Bot size={22} />
                </span>
                <span className={`status ${a.status}`}>{a.status}</span>
              </div>
              <h3>{a.name}</h3>
              <p>{a.description || "Custom AI assistant"}</p>
              <p className="mt-4 text-xs text-electric">
                GPT-6 Astra · {data.conversations.filter((c) => c.agent_id === a.id).length}{" "}
                conversations
              </p>
              <div className="flex gap-2 mt-6 flex-wrap">
                <Button
                  variant="brand"
                  onClick={() => {
                    setTesting(a);
                    setResponse("");
                  }}
                >
                  Test agent
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${a.name}`}
                  onClick={() => {
                    setEditing(a);
                    setOpen(true);
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Toggle ${a.name}`}
                  onClick={async () => {
                    try {
                      await save({
                        data: {
                          id: a.id,
                          name: a.name,
                          description: a.description,
                          instructions: a.instructions,
                          status: a.status === "active" ? "inactive" : "active",
                        },
                      });
                      await query.invalidateQueries({ queryKey: ["workspace"] });
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not update agent");
                    }
                  }}
                >
                  {a.status === "active" ? <Pause /> : <Play />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${a.name}`}
                  onClick={() => setDeleting(a)}
                >
                  <Trash2 />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit agent" : "Create agent"}</DialogTitle>
            <DialogDescription>
              Give your AI teammate a clear purpose and instructions.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Agent name" name="name" value={editing?.name} />
            <Field
              label="Description / objective"
              name="description"
              required={false}
              value={editing?.description}
            />
            <label className="form-field">
              Model
              <select className="field-control">
                <option>OpenAI GPT-6 Astra</option>
              </select>
            </label>
            <label className="form-field">
              Instructions
              <textarea
                name="instructions"
                className="field-control"
                required
                maxLength={12000}
                defaultValue={editing?.instructions ?? ""}
                rows={6}
                placeholder="You are a helpful support assistant. Your goal is…"
              />
            </label>
            <Button variant="brand" disabled={busy}>
              {busy ? "Saving…" : "Save agent"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!testing}
        onOpenChange={(o) => {
          if (!o) setTesting(null);
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{testing?.name}</DialogTitle>
            <DialogDescription>
              Test your agent and review previous conversations.
            </DialogDescription>
          </DialogHeader>
          {data.conversations
            .filter((c) => c.agent_id === testing?.id)
            .slice(0, 5)
            .reverse()
            .map((c) => (
              <div key={c.id} className="border-b border-border py-4">
                <p className="text-xs text-muted-foreground">You: {c.prompt}</p>
                <p className="text-sm mt-3 whitespace-pre-wrap">{c.response}</p>
              </div>
            ))}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!testing) return;
              const f = new FormData(e.currentTarget);
              setBusy(true);
              setResponse("");
              try {
                const r = await test({ data: { id: testing.id, prompt: String(f.get("prompt")) } });
                setResponse(r.response);
                await query.invalidateQueries({ queryKey: ["workspace"] });
              } catch (e) {
                setResponse(e instanceof Error ? e.message : "Agent request failed.");
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-4"
          >
            <label className="form-field">
              Your message
              <textarea
                name="prompt"
                className="field-control"
                required
                rows={3}
                maxLength={5000}
              />
            </label>
            <Button variant="brand" disabled={busy}>
              {busy ? "Thinking…" : "Send message"}
              <ArrowUpRight />
            </Button>
          </form>
          {response && (
            <p role="status" className="text-sm leading-7 whitespace-pre-wrap mt-4">
              {response}
            </p>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete agent?</DialogTitle>
            <DialogDescription>
              This removes the agent and its conversation history.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!deleting) return;
              try {
                await remove({ data: { id: deleting.id } });
                setDeleting(null);
                await query.invalidateQueries({ queryKey: ["workspace"] });
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not delete agent");
              }
            }}
          >
            Delete agent
          </Button>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
export function Integrations() {
  const { data } = useSuspenseQuery(workspaceOptions);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("");
  return (
    <WorkspaceShell title="Integrations">
      <Heading
        title="Your tools, working together."
        description="Connect your applications to unlock your workflows."
      />
      <input
        className="field-control max-w-sm mt-7"
        aria-label="Search integrations"
        placeholder="Search integrations…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="service-grid">
        {providers
          .filter((p) => p.toLowerCase().includes(search.toLowerCase()))
          .map((p) => {
            const connected = data.integrations.some(
              (i) => i.provider === p && i.connection_status === "connected",
            );
            return (
              <article className="service-card" key={p}>
                <div className="flex justify-between items-center">
                  <span className="service-icon font-bold">{p.slice(0, 1)}</span>
                  <span className={`status ${connected ? "active" : ""}`}>
                    {connected ? "Connected" : "Not connected"}
                  </span>
                </div>
                <h3>{p}</h3>
                <p>Bring {p} into your connected automation workspace.</p>
                <Button variant="outline" className="mt-5" onClick={() => setProvider(p)}>
                  <Plug />
                  {connected ? "Manage connection" : "Connect"}
                </Button>
              </article>
            );
          })}
      </div>
      <Dialog
        open={!!provider}
        onOpenChange={(o) => {
          if (!o) setProvider("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {provider}</DialogTitle>
            <DialogDescription>Connection setup is required.</DialogDescription>
          </DialogHeader>
          <p className="section-copy">
            {provider === "n8n"
              ? "The platform owner must connect n8n in Lovable before workflows can execute."
              : "Per-account authorization for this provider has not been configured. No connection or credentials have been saved."}
          </p>
          <Button variant="brand" asChild>
            <Link to="/support">
              Contact support <ArrowUpRight />
            </Link>
          </Button>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
export function Templates() {
  const query = useQueryClient();
  const save = useServerFn(saveWorkflow);
  const [busy, setBusy] = useState("");
  return (
    <WorkspaceShell title="Workflow Templates">
      <Heading
        title="Skip the blank canvas."
        description="A starting point for your next intelligent workflow."
      />
      <div className="service-grid">
        {templates.map((t, i) => (
          <article className="service-card" key={t}>
            <span className="service-icon">
              <Workflow size={22} />
            </span>
            <h3>{t}</h3>
            <p>
              A ready-to-configure workflow for your business. Saved as a draft, with no simulated
              execution.
            </p>
            <Button
              variant="outline"
              className="mt-5"
              disabled={!!busy}
              onClick={async () => {
                setBusy(t);
                try {
                  await save({
                    data: {
                      name: t,
                      description: `Template: ${t}`,
                      category: i < 2 ? "Business" : "Customer support",
                      trigger: i === 0 ? "New customer" : i === 2 ? "New order" : "Manual trigger",
                      action:
                        i === 0 ? "Send email" : i === 2 ? "Send notification" : "Save contact",
                      status: "draft",
                    },
                  });
                  toast.success("Template saved as a draft.");
                  await query.invalidateQueries({ queryKey: ["workspace"] });
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not save template");
                } finally {
                  setBusy("");
                }
              }}
            >
              {busy === t ? "Saving…" : "Use template"}
              <ArrowUpRight />
            </Button>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
export function Activity() {
  const { data } = useSuspenseQuery(workspaceOptions);
  return (
    <WorkspaceShell title="Activity Logs">
      <Heading
        title="Every step, in view."
        description="Recent activity and real workflow execution results."
      />
      <section className="mt-8">
        <h2 className="text-sm font-semibold mb-4">Workspace activity</h2>
        {!data.activities.length ? (
          <Empty
            icon={History}
            title="No activity yet."
            description="Saved and updated workflows and agents will appear here."
          />
        ) : (
          data.activities.map((a) => (
            <div className="data-row" key={a.id}>
              <div>
                <span className="text-xs">{a.description}</span>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
              <span className="status">{a.action}</span>
            </div>
          ))
        )}
      </section>
      <section className="mt-10">
        <h2 className="text-sm font-semibold mb-4">Execution history</h2>
        {!data.executions.length ? (
          <Empty
            icon={Workflow}
            title="No executions yet."
            description="Only verified execution results appear here. Connect n8n to run workflows."
          />
        ) : (
          data.executions.map((e) => (
            <div className="data-row" key={e.id}>
              <div>
                <h3 className="text-sm">
                  {data.automations.find((a) => a.id === e.automation_id)?.name ?? "Workflow"}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(e.started_at).toLocaleString()}
                </p>
                {e.error_message && <p className="text-xs text-destructive">{e.error_message}</p>}
              </div>
              <span className={`status ${e.execution_status}`}>{e.execution_status}</span>
            </div>
          ))
        )}
      </section>
    </WorkspaceShell>
  );
}
export function Analytics() {
  const { data } = useSuspenseQuery(workspaceOptions);
  return (
    <WorkspaceShell title="Analytics">
      <Heading
        title="A clearer picture of progress."
        description="Performance based on verified workflow executions."
      />
      <Metrics />
      <ExecutionChart />
      <div className="mt-10">
        <h2 className="text-sm font-semibold mb-5">Workflow performance</h2>
        {data.executions.length === 0 ? (
          <Empty
            icon={ChartNoAxesCombined}
            title="Your results will tell the story."
            description="Run connected automations to see execution performance here."
          />
        ) : (
          data.automations.map((a) => {
            const runs = data.executions.filter((e) => e.automation_id === a.id);
            return (
              <div className="data-row" key={a.id}>
                <span className="text-sm">{a.name}</span>
                <span className="text-xs text-muted-foreground">
                  {runs.length} runs ·{" "}
                  {runs.filter((e) => e.execution_status === "completed").length} completed
                </span>
              </div>
            );
          })
        )}
      </div>
    </WorkspaceShell>
  );
}
export function Billing() {
  const { data } = useSuspenseQuery(workspaceOptions);
  return (
    <WorkspaceShell title="Billing & Subscription">
      <Heading
        title="Room for your next chapter."
        description="Your subscription and billing details."
      />
      <div className="border-y border-border py-8 my-8 flex justify-between items-center gap-5">
        <div>
          <span className="eyebrow">Current plan</span>
          <h2 className="text-3xl font-bold mt-3 capitalize">
            {data.subscription?.plan ?? "Free"}
          </h2>
          <p className="text-xs text-muted-foreground mt-3">
            {data.subscription?.payment_provider
              ? "Payment-provider managed subscription"
              : "No payment method on file"}
          </p>
        </div>
        <span className="status active">
          {data.subscription?.subscription_status ?? "Free workspace"}
        </span>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {["Pro", "Business"].map((p) => (
          <article key={p} className="service-card">
            <span className="eyebrow">{p}</span>
            <h3>{p === "Pro" ? "More power. More possibility." : "Intelligence at your scale."}</h3>
            <p>
              Paid subscriptions are not yet configured. No payment will be collected until secure
              payment verification is enabled.
            </p>
            <Button variant="outline" className="mt-5" asChild>
              <Link to="/contact">
                {p === "Pro" ? "Join the waitlist" : "Contact sales"}
                <ArrowUpRight />
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </WorkspaceShell>
  );
}
export function AccountSettings() {
  const { data } = useSuspenseQuery(workspaceOptions);
  const query = useQueryClient();
  const update = useServerFn(updateProfile);
  const [busy, setBusy] = useState(false);
  const [avatar, setAvatar] = useState("");
  useEffect(() => {
    let active = true;
    const path = data.profile.avatar_url;
    if (path)
      void supabase.storage
        .from("rigor-avatars")
        .createSignedUrl(path, 3600)
        .then(({ data: result }) => {
          if (active && result) setAvatar(result.signedUrl);
        });
    return () => {
      active = false;
    };
  }, [data.profile.avatar_url]);
  async function profileSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await update({
        data: { full_name: String(f.get("name")), avatar_url: data.profile.avatar_url },
      });
      await query.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save profile");
    } finally {
      setBusy(false);
    }
  }
  return (
    <WorkspaceShell title="Settings">
      <Heading title="Make yourself at home." description="Your profile and account security." />
      <div className="max-w-xl mt-10">
        <h2 className="text-sm font-semibold mb-6">Profile information</h2>
        <div className="flex items-center gap-5 mb-7">
          {avatar ? (
            <img
              src={avatar}
              alt="Your profile picture"
              className="size-16 object-cover rounded-full"
            />
          ) : (
            <span className="size-16 rounded-full bg-accent text-electric grid place-items-center text-xl font-bold">
              {data.profile.full_name.slice(0, 1) || "R"}
            </span>
          )}
          <label className="text-xs flex items-center gap-2 cursor-pointer border border-border rounded-md px-4 py-2">
            <Upload size={14} />
            Upload photo
            <input
              aria-label="Upload profile picture"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast.error("Choose an image under 2 MB.");
                  return;
                }
                const path = `${data.profile.id}/${crypto.randomUUID()}`;
                try {
                  const r = await supabase.storage.from("rigor-avatars").upload(path, file);
                  if (r.error) throw r.error;
                  await update({
                    data: { full_name: data.profile.full_name || "Your account", avatar_url: path },
                  });
                  const signed = await supabase.storage
                    .from("rigor-avatars")
                    .createSignedUrl(path, 3600);
                  if (signed.error) throw signed.error;
                  setAvatar(signed.data.signedUrl);
                  await query.invalidateQueries({ queryKey: ["workspace"] });
                  toast.success("Photo updated.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not upload photo");
                }
              }}
            />
          </label>
        </div>
        <form className="space-y-5" onSubmit={profileSubmit}>
          <Field name="name" label="Full name" value={data.profile.full_name} />
          <label className="form-field">
            Email address
            <input className="field-control" value={data.profile.email} readOnly />
          </label>
          <Button variant="brand" disabled={busy}>
            Save profile
          </Button>
        </form>
        <h2 className="text-sm font-semibold mt-12 mb-6">Change password</h2>
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            setBusy(true);
            try {
              const r = await supabase.auth.updateUser({
                password: String(f.get("new")),
                current_password: String(f.get("current")),
              });
              if (r.error) throw r.error;
              form.reset();
              toast.success("Password updated.");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Could not update password");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="form-field">
            Current password
            <input
              className="field-control"
              name="current"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <label className="form-field">
            New password
            <input
              className="field-control"
              name="new"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          <Button variant="outline" disabled={busy}>
            Update password
          </Button>
        </form>
      </div>
    </WorkspaceShell>
  );
}
export function Support() {
  return (
    <WorkspaceShell title="Help & Support">
      <Heading
        title="A little help goes a long way."
        description="Let's make your next step a confident one."
      />
      <div className="mt-8 grid md:grid-cols-2 gap-8">
        <section>
          <h2 className="text-sm font-semibold mb-5">Frequently asked questions</h2>
          {[
            [
              "Why are there no executions?",
              "Workflow configuration is separate from execution. The platform owner needs to connect n8n to run workflows and store verified results.",
            ],
            [
              "How do I connect an integration?",
              "Connection setup requires provider authorization. Until configured and verified, integrations remain disconnected.",
            ],
            [
              "How do I change my password?",
              "Visit Settings to change your password with your current password, or request a recovery email from the sign-in page.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="border-b border-border py-5">
              <summary className="text-sm cursor-pointer">{q}</summary>
              <p className="section-copy mt-3">{a}</p>
            </details>
          ))}
        </section>
        <section className="pt-3">
          <LifeBuoy size={32} className="text-electric" />
          <h2 className="text-xl font-semibold mt-5">Let's talk.</h2>
          <p className="section-copy mt-3">
            Ask a question, share an idea, or tell us where you’re stuck.
          </p>
          <Button variant="brand" asChild className="mt-6">
            <Link to="/contact">
              Contact support <ArrowUpRight />
            </Link>
          </Button>
        </section>
      </div>
    </WorkspaceShell>
  );
}
