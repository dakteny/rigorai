import { describe, it, expect } from "vitest";
import { workflowSchema, agentSchema } from "@/lib/validation";
describe("Workflow integrity", () => {
  const base = {
    name: "Welcome email",
    description: "Welcome new customers",
    category: "Email",
    trigger: "New customer",
    action: "Send email",
  };
  it("does not accept successful execution as user configured state", () => {
    expect(workflowSchema.safeParse({ ...base, status: "completed" }).success).toBe(false);
  });
  it("does not accept failed execution as user configured state", () => {
    expect(workflowSchema.safeParse({ ...base, status: "failed" }).success).toBe(false);
  });
  it("accepts saved draft workflow configurations", () => {
    expect(workflowSchema.parse({ ...base, status: "draft" }).status).toBe("draft");
  });
  it("requires instructions for AI agents", () => {
    expect(
      agentSchema.safeParse({
        name: "Support",
        description: "Customer support",
        instructions: "",
        status: "inactive",
      }).success,
    ).toBe(false);
  });
});
