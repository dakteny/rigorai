import { z } from "zod";

export const websiteSettingsSchema = z
  .object({
    founder: z.string().trim().min(1).max(200),
    location: z.string().trim().min(1).max(200),
    website: z
      .url()
      .max(300)
      .refine((value) => value.startsWith("https://"), "Use a secure https website address"),
    email: z.email().max(254),
    phone: z.string().trim().min(1).max(60),
    tagline: z.string().trim().min(1).max(200),
  })
  .strict();
export const saveWebsiteSettingsSchema = websiteSettingsSchema
  .extend({
    expected_updated_at: z.iso.datetime({ offset: true }),
  })
  .strict();
export const websiteSettingFields = [
  { key: "founder", label: "Founder", maxLength: 200, type: "text" },
  { key: "location", label: "Location", maxLength: 200, type: "text" },
  { key: "website", label: "Website", maxLength: 300, type: "url" },
  { key: "email", label: "Email", maxLength: 254, type: "email" },
  { key: "phone", label: "Phone", maxLength: 60, type: "tel" },
  { key: "tagline", label: "Tagline", maxLength: 200, type: "text" },
] as const;

export function changedSettingsLabels(changes: Record<string, unknown>) {
  return websiteSettingFields.filter((field) => field.key in changes).map((field) => field.label);
}
