import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isRecoveryHash, recoveryIntentKey } from "./recovery-intent";
export const attachAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  if (typeof window === "undefined") return next();
  // Public initial reads can initialize Auth before the recovery page mounts.
  if (window.location.pathname === "/reset-password" && isRecoveryHash(window.location.hash))
    window.sessionStorage.setItem(recoveryIntentKey, "pending");
  const { data } = await supabase.auth.getSession();
  return next({
    headers: data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {},
  });
});
