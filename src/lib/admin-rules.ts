import { z } from "zod";

export const adminRoleSchema = z.object({ id: z.uuid(), role: z.enum(["admin", "staff"]) });
export const adminRecordSchema = z
  .object({
    id: z.uuid(),
    kind: z.enum(["workflow", "agent"]),
    name: z.string().trim().min(1).max(120),
    description: z.string().max(2000),
    status: z.enum(["draft", "active", "paused", "inactive"]),
    instructions: z.string().trim().max(12000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === "workflow" && data.status === "inactive")
      ctx.addIssue({ code: "custom", message: "Invalid workflow status", path: ["status"] });
    if (data.kind === "agent" && !["active", "inactive"].includes(data.status))
      ctx.addIssue({ code: "custom", message: "Invalid agent status", path: ["status"] });
    if (data.kind === "agent" && !data.instructions)
      ctx.addIssue({
        code: "custom",
        message: "Agent instructions are required",
        path: ["instructions"],
      });
  });

export function assertAdministrator(verified: boolean) {
  if (!verified) throw new Error("Administrator access required");
}

export function assertAccountChange(
  actorId: string,
  targetId: string,
  isAdmin: boolean,
  disabled: boolean,
) {
  if (actorId === targetId) throw new Error("You cannot change your own account access");
  if (isAdmin && disabled) throw new Error("Administrator accounts cannot be disabled");
}
