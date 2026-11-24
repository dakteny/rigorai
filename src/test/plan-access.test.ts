import { describe, expect, it } from "vitest";
import { resolvePlanAccess } from "@/lib/plan-access";

describe("Administrator plan access", () => {
  it("grants verified administrators Free, Pro and Business without a subscription", () => {
    expect(resolvePlanAccess([{ role: "admin" }], null).plans).toEqual(["Free", "Pro", "Business"]);
  });
  it("does not grant administrator plan access to customer or staff accounts", () => {
    expect(resolvePlanAccess([{ role: "customer" }, { role: "staff" }], "free").plans).toEqual([
      "Free",
    ]);
    expect(resolvePlanAccess([{ role: "customer" }], "pro").isAdministrator).toBe(false);
  });
});
