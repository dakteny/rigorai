import { describe, expect, it } from "vitest";
import { adminRecordSchema, adminRoleSchema, assertAccountChange, assertAdministrator } from "@/lib/admin-rules";

describe("Website-wide administrator permissions", () => {
  it("requires a verified administrator for privileged access", () => {
    expect(() => assertAdministrator(false)).toThrow("Administrator access required");
    expect(() => assertAdministrator(true)).not.toThrow();
  });
  it("prevents administrators from disabling their own access", () => {
    expect(() => assertAccountChange("owner", "owner", true, true)).toThrow();
  });
  it("protects other administrators from account lockout", () => {
    expect(() => assertAccountChange("owner", "other", true, true)).toThrow();
    expect(() => assertAccountChange("owner", "customer", false, true)).not.toThrow();
  });
  it("accepts only defined elevated roles", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    expect(adminRoleSchema.safeParse({ id, role: "admin" }).success).toBe(true);
    expect(adminRoleSchema.safeParse({ id, role: "owner" }).success).toBe(false);
  });
  it("cannot fabricate successful executions through admin editing", () => {
    expect(adminRecordSchema.safeParse({ id: "00000000-0000-4000-8000-000000000001", kind: "workflow", name: "Workflow", description: "", status: "completed" }).success).toBe(false);
  });
});