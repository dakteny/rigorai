import { z } from "zod";
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email(),
  company: z.string().max(150),
  service: z.string().min(1).max(120),
  message: z.string().trim().min(1).max(5000),
});
export const workflowSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  category: z.string().min(1).max(80),
  trigger: z.string().min(1).max(200),
  action: z.string().min(1).max(200),
  status: z.enum(["draft", "active", "paused"]),
});
export const agentSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000),
  instructions: z.string().trim().min(1).max(12000),
  status: z.enum(["active", "inactive"]),
});
