import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireActiveAccount as requireSupabaseAuth } from "./account-middleware";
import { contactSchema, workflowSchema, agentSchema } from "./validation";
export const workspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const s = context.supabase;
    const uid = context.userId;
    const profile = await s.from("profiles").select("*").eq("id", uid).single();
    if (profile.error) throw new Error(profile.error.message);
    if (profile.data.disabled) throw new Error("Your account is disabled. Contact support.");
    const [
      automations,
      executions,
      agents,
      integrations,
      activities,
      subscription,
      notifications,
      roles,
      conversations,
    ] = await Promise.all([
      s
        .from("automations")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(500),
      s
        .from("automation_executions")
        .select("*")
        .eq("user_id", uid)
        .order("started_at", { ascending: false })
        .limit(500),
      s.from("ai_agents").select("*").eq("user_id", uid).order("created_at", { ascending: false }),
      s.from("integrations").select("*").eq("user_id", uid),
      s
        .from("activity_logs")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      s.from("subscriptions").select("*").eq("user_id", uid).maybeSingle(),
      s
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
      s.from("user_roles").select("role").eq("user_id", uid),
      s
        .from("agent_conversations")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    for (const result of [
      automations,
      executions,
      agents,
      integrations,
      activities,
      subscription,
      notifications,
      roles,
      conversations,
    ])
      if (result.error) throw new Error(result.error.message);
    return {
      profile: profile.data,
      automations: automations.data ?? [],
      executions: executions.data ?? [],
      agents: agents.data ?? [],
      integrations: integrations.data ?? [],
      activities: activities.data ?? [],
      subscription: subscription.data,
      notifications: notifications.data ?? [],
      roles: roles.data ?? [],
      conversations: conversations.data ?? [],
    };
  });
export const saveWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(workflowSchema)
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      name: data.name,
      description: data.description,
      category: data.category,
      trigger_config: { type: data.trigger },
      action_config: { type: data.action },
      status: data.status,
    };
    const r = data.id
      ? await context.supabase
          .from("automations")
          .update(row)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select()
          .single()
      : await context.supabase.from("automations").insert(row).select().single();
    if (r.error) throw new Error(r.error.message);
    return r.data;
  });
export const deleteWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase
      .from("automations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });
export const saveAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(agentSchema)
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      name: data.name,
      description: data.description,
      instructions: data.instructions,
      status: data.status,
      model: "openai/gpt-6-astra",
    };
    const r = data.id
      ? await context.supabase
          .from("ai_agents")
          .update(row)
          .eq("id", data.id)
          .eq("user_id", context.userId)
          .select()
          .single()
      : await context.supabase.from("ai_agents").insert(row).select().single();
    if (r.error) throw new Error(r.error.message);
    return r.data;
  });
export const deleteAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase
      .from("ai_agents")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });
export const testAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.uuid(), prompt: z.string().trim().min(1).max(5000) }))
  .handler(async ({ data, context }) => {
    const { data: agent, error } = await context.supabase
      .from("ai_agents")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();
    if (error || !agent) throw new Error("Agent not found");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("disabled")
      .eq("id", context.userId)
      .single();
    if (!profile || profile.disabled) throw new Error("Account unavailable");
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    let response: string;
    try {
      const result = await generateResponse({
        model: "openai/gpt-6-astra",
        instructions: agent.instructions,
        input: data.prompt,
        max_output_tokens: 1500,
      });
      response = result.output
        .flatMap((item) =>
          item.type === "message"
            ? item.content.map((c) => (c.type === "output_text" ? c.text : c.refusal))
            : [],
        )
        .join("\n");
      if (!response) throw new Error("The agent did not return a response.");
    } catch (error) {
      if (error instanceof GatewayError) {
        console.error("AI request failed", error.code, error.httpStatus, error.ids);
        throw new Error(`AI request unavailable (${error.code}). ${error.message}`);
      }
      throw error;
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await supabaseAdmin
      .from("agent_conversations")
      .insert({ user_id: context.userId, agent_id: agent.id, prompt: data.prompt, response });
    if (r.error) throw new Error("Response received, but conversation could not be saved.");
    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: context.userId,
        title: "Agent task completed",
        message: `${agent.name} responded to your test.`,
      });
    return { response };
  });
export const contactSubmit = createServerFn({ method: "POST" })
  .inputValidator(contactSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await supabaseAdmin.from("contact_messages").insert(data);
    if (r.error) throw new Error("Your message could not be saved. Please try again.");
    return { ok: true };
  });
export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      full_name: z.string().trim().min(1).max(120),
      avatar_url: z.string().max(300).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (data.avatar_url && !data.avatar_url.startsWith(`${context.userId}/`))
      throw new Error("Invalid avatar path");
    const r = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });
export const readNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.uuid() }))
  .handler(async ({ data, context }) => {
    const r = await context.supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });
export const adminData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role.error || !role.data) throw new Error("Administrator access required");
    const [users, contacts, executions, automations, activity] = await Promise.all([
      context.supabase.from("profiles").select("*").limit(500),
      context.supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
      context.supabase.from("automation_executions").select("*").limit(500),
      context.supabase.from("automations").select("*").limit(500),
      context.supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    for (const r of [users, contacts, executions, automations, activity])
      if (r.error) throw new Error(r.error.message);
    return {
      users: users.data ?? [],
      contacts: contacts.data ?? [],
      executions: executions.data ?? [],
      automations: automations.data ?? [],
      activity: activity.data ?? [],
    };
  });
export const setAccountState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.uuid(), disabled: z.boolean() }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role.error || !role.data) throw new Error("Administrator access required");
    if (data.id === context.userId) throw new Error("You cannot disable your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await supabaseAdmin
      .from("profiles")
      .update({ disabled: data.disabled })
      .eq("id", data.id);
    if (r.error) throw new Error(r.error.message);
    await supabaseAdmin
      .from("activity_logs")
      .insert({
        user_id: context.userId,
        action: "account_state",
        description: `Account ${data.id} ${data.disabled ? "disabled" : "enabled"}`,
      });
    return { ok: true };
  });
