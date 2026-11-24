import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const requireActiveAccount = createMiddleware({ type: "function" })
  .middleware([requireSupabaseAuth])
  .server(async ({ next, context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("disabled")
      .eq("id", context.userId)
      .single();
    if (error || !data || data.disabled) throw new Error("Account unavailable. Contact support.");
    return next();
  });
