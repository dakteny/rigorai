export const recoveryIntentKey = "rigor-password-recovery-pending";

// This preserves only UI intent, never a token or permission. Supabase validates the session.
export function isRecoveryHash(hash: string) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get("type") === "recovery" && Boolean(params.get("access_token"));
}
