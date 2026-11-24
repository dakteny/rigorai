import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Site } from "@/components/site";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/metadata";
import { isRecoveryHash, recoveryIntentKey } from "@/lib/recovery-intent";
export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead(
      "Reset Your Password",
      "Securely choose a new Rigor AI password with your recovery link.",
    ),
  component: Reset,
});
function Reset() {
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const requested =
      isRecoveryHash(window.location.hash) ||
      window.sessionStorage.getItem(recoveryIntentKey) === "pending";
    if (!requested) {
      setMessage("Open the password recovery link from your email to continue.");
      return;
    }
    let active = true;
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (!error && data.user) setValid(true);
      else {
        window.sessionStorage.removeItem(recoveryIntentKey);
        setMessage("This recovery link is invalid or expired. Request a new password reset link.");
      }
    });
    return () => {
      active = false;
    };
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm")) {
      setMessage("Passwords do not match.");
      return;
    }
    setBusy(true);
    const r = await supabase.auth.updateUser({ password: String(f.get("password")) });
    setMessage(
      r.error ? r.error.message : "Password updated. You can now sign in with your new password.",
    );
    if (!r.error) {
      setValid(false);
      window.sessionStorage.removeItem(recoveryIntentKey);
    }
    setBusy(false);
  }
  return (
    <Site>
      <div className="auth-layout">
        <div className="auth-panel">
          <h1 className="section-title">A fresh start.</h1>
          {valid && (
            <form method="post" className="space-y-5" onSubmit={submit}>
              <label className="form-field">
                New password
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="field-control"
                />
              </label>
              <label className="form-field">
                Confirm new password
                <input
                  name="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="field-control"
                />
              </label>
              <Button variant="brand" disabled={busy}>
                Update password
              </Button>
            </form>
          )}
          <p role="status" className="mt-5 section-copy">
            {message}
          </p>
        </div>
      </div>
    </Site>
  );
}
