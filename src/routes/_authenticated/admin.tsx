import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { WorkspaceShell } from "@/components/workspace";
import { Button } from "@/components/ui/button";
import { adminData, setAccountState } from "@/lib/platform.functions";
import { workspaceOptions } from "@/lib/workspace-query";
import { pageHead } from "@/lib/metadata";
const options = queryOptions({ queryKey: ["admin"], queryFn: () => adminData() });
export const Route = createFileRoute("/_authenticated/admin")({
  head: () =>
    pageHead(
      "Administration",
      "Authorized administration of Rigor AI accounts, enquiries and execution monitoring.",
    ),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(workspaceOptions);
    return context.queryClient.ensureQueryData(options);
  },
  component: Admin,
});
function Admin() {
  const { data } = useSuspenseQuery(options);
  const [tab, setTab] = useState("Users");
  const change = useServerFn(setAccountState);
  const query = useQueryClient();
  return (
    <WorkspaceShell title="Administration">
      <h1 className="text-2xl font-bold">Platform overview.</h1>
      <p className="section-copy mt-3">Authorized administration and real platform activity.</p>
      <div className="metric-grid">
        {[
          ["Accounts", data.users.length],
          ["Workflows", data.automations.length],
          ["Failed runs", data.executions.filter((e) => e.execution_status === "failed").length],
          ["Enquiries", data.contacts.length],
        ].map(([l, v]) => (
          <div className="metric" key={String(l)}>
            <span className="text-xs text-muted-foreground">{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap border-b border-border gap-3 mb-7">
        {["Users", "Messages", "Executions", "Activity", "Services & Plans"].map((t) => (
          <Button variant={tab === t ? "secondary" : "ghost"} key={t} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>
      {tab === "Users" &&
        data.users.map((u) => (
          <div key={u.id} className="data-row">
            <div>
              <h2 className="text-sm">{u.full_name || "Unnamed account"}</h2>
              <p className="text-xs text-muted-foreground mt-2">{u.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await change({ data: { id: u.id, disabled: !u.disabled } });
                  await query.invalidateQueries({ queryKey: ["admin"] });
                  toast.success("Account status updated.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Account update failed");
                }
              }}
            >
              {u.disabled ? "Enable account" : "Disable account"}
            </Button>
          </div>
        ))}
      {tab === "Messages" &&
        data.contacts.map((c) => (
          <article key={c.id} className="border-b border-border py-6">
            <h2 className="text-sm font-semibold">
              {c.name} · {c.service}
            </h2>
            <p className="text-xs text-electric mt-2">
              {c.email} {c.company && `· ${c.company}`}
            </p>
            <p className="text-sm whitespace-pre-wrap mt-4">{c.message}</p>
          </article>
        ))}
      {tab === "Executions" &&
        data.executions.map((e) => (
          <div className="data-row" key={e.id}>
            <div>
              <p className="text-sm">{e.automation_id}</p>
              <p className="text-xs text-destructive mt-2">{e.error_message}</p>
            </div>
            <span className={`status ${e.execution_status}`}>{e.execution_status}</span>
          </div>
        ))}
      {tab === "Activity" &&
        data.activity.map((a) => (
          <div className="data-row" key={a.id}>
            <span className="text-xs">{a.description}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(a.created_at).toLocaleString()}
            </span>
          </div>
        ))}
      {tab === "Services & Plans" && (
        <p className="section-copy">
          Service and plan editing requires a published pricing and entitlement policy. Free, Pro,
          and Business plans are displayed publicly; payment collection is not configured.
        </p>
      )}
      {((tab === "Executions" && !data.executions.length) ||
        (tab === "Messages" && !data.contacts.length)) && (
        <p className="section-copy py-8">No records yet.</p>
      )}
    </WorkspaceShell>
  );
}
