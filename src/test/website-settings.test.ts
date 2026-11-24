import { describe, expect, it } from "vitest";
import { saveWebsiteSettingsSchema, changedSettingsLabels } from "@/lib/website-settings";

const settings = {
  founder: "Founder",
  location: "Halifax",
  website: "https://www.RigorEx.ca",
  email: "hello@rigorex.ca",
  phone: "+1 (902) 210-8363",
  tagline: "Intelligent Automation. Real Results.",
  expected_updated_at: "2026-11-24T13:00:00+00:00",
};
describe("Website settings integrity", () => {
  it("cannot accept a client-supplied audit actor or audit timestamp", () => {
    expect(
      saveWebsiteSettingsSchema.safeParse({ ...settings, actor_id: "another-user" }).success,
    ).toBe(false);
    expect(
      saveWebsiteSettingsSchema.safeParse({ ...settings, created_at: "2020-01-01" }).success,
    ).toBe(false);
  });
  it("rejects executable website links", () => {
    expect(
      saveWebsiteSettingsSchema.safeParse({ ...settings, website: "javascript:alert(1)" }).success,
    ).toBe(false);
  });
  it("identifies the fields recorded in each change", () => {
    expect(
      changedSettingsLabels({
        email: { before: "old@rigorex.ca", after: "hello@rigorex.ca" },
        phone: { before: "1", after: "2" },
      }),
    ).toEqual(["Email", "Phone"]);
  });
});
