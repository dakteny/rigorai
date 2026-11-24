import { queryOptions } from "@tanstack/react-query";
import { getWebsiteSettings, getWebsiteSettingsAudit } from "./platform.functions";

export const websiteSettingsOptions = queryOptions({
  queryKey: ["website-settings"],
  queryFn: () => getWebsiteSettings(),
  staleTime: 30_000,
});
export const websiteAuditOptions = queryOptions({
  queryKey: ["website-settings-audit"],
  queryFn: () => getWebsiteSettingsAudit(),
});
