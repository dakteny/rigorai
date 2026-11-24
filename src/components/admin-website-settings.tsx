import { useState, type FormEvent } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { websiteSettingsOptions, websiteAuditOptions } from "@/lib/website-settings-query";
import { saveWebsiteSettings } from "@/lib/platform.functions";
import { websiteSettingFields } from "@/lib/website-settings";

export function AdminWebsiteSettings() {
  const { data } = useSuspenseQuery(websiteSettingsOptions);
  const query = useQueryClient();
  const save = useServerFn(saveWebsiteSettings);
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await save({
        data: {
          founder: String(form.get("founder")),
          location: String(form.get("location")),
          website: String(form.get("website")),
          email: String(form.get("email")),
          phone: String(form.get("phone")),
          tagline: String(form.get("tagline")),
          expected_updated_at: data.updated_at,
        },
      });
      await Promise.all([
        query.invalidateQueries({ queryKey: websiteSettingsOptions.queryKey }),
        query.invalidateQueries({ queryKey: websiteAuditOptions.queryKey }),
      ]);
      toast.success("Website settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Settings could not be saved");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form method="post" onSubmit={submit} key={data.updated_at} className="max-w-3xl">
      <fieldset disabled={busy} className="grid sm:grid-cols-2 gap-5">
        {websiteSettingFields.map((field) => (
          <label className="form-field" key={field.key}>
            {field.label}
            <input
              className="field-control"
              name={field.key}
              type={field.type}
              required
              maxLength={field.maxLength}
              defaultValue={data[field.key]}
            />
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap justify-between items-center gap-4 border-t border-border mt-7 pt-5">
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(data.updated_at).toLocaleString()}
        </p>
        <Button type="submit" variant="brand" disabled={busy}>
          <Save />
          {busy ? "Saving…" : "Save website settings"}
        </Button>
      </div>
    </form>
  );
}

export function AdminWebsiteAudit({ search }: { search: string }) {
  const { data } = useSuspenseQuery(websiteAuditOptions);
  const visible = data.filter((entry) =>
    `${entry.actor_name} ${entry.actor_email} ${JSON.stringify(entry.changes)}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div>
      {visible.map((entry) => {
        const changes =
          entry.changes && typeof entry.changes === "object" && !Array.isArray(entry.changes)
            ? entry.changes
            : {};
        return (
          <article key={entry.id} className="border-b border-border py-5">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="text-electric" size={16} />
                  {entry.actor_name}
                </h3>
                <p className="text-xs text-muted-foreground mt-2 break-all">{entry.actor_email}</p>
              </div>
              <time dateTime={entry.created_at} className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </time>
            </div>
            <div className="mt-5 space-y-4">
              {Object.entries(changes).map(([key, value]) => {
                if (!value || typeof value !== "object" || Array.isArray(value)) return null;
                const label = websiteSettingFields.find((field) => field.key === key)?.label ?? key;
                return (
                  <div
                    key={key}
                    className="grid sm:grid-cols-[100px_1fr_1fr] gap-2 sm:gap-4 text-xs"
                  >
                    <h4 className="font-semibold">{label}</h4>
                    <div className="min-w-0">
                      <span className="text-muted-foreground block mb-1">Previous</span>
                      <p className="break-words text-muted-foreground">
                        {String(value["before"] ?? "—")}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <span className="text-muted-foreground block mb-1">New</span>
                      <p className="break-words">{String(value["after"] ?? "—")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
      {visible.length === 0 && (
        <p className="text-sm text-muted-foreground py-12 text-center">
          {search ? "No matching changes." : "No website settings changes yet."}
        </p>
      )}
    </div>
  );
}
