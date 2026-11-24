import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { Site } from "@/components/site";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode: "signup" | "forgot" | "login" } => ({
    mode: s["mode"] === "signup" ? "signup" : s["mode"] === "forgot" ? "forgot" : "login",
  }),
  head: () =>
    pageHead("Your Workspace", "Sign in or create your private Rigor AI automation workspace."),
  component: Auth,
});
function Auth() {
  const { mode } = Route.useSearch();
  return <AuthForm key={mode} mode={mode} />;
}
function AuthForm({ mode }: { mode: "signup" | "forgot" | "login" }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password") ?? "");
    try {
      if (mode === "forgot") {
        const r = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (r.error) throw r.error;
        setMessage("If an account exists, a password reset link has been sent.");
      } else if (mode === "signup") {
        const r = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: String(f.get("name")).trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (r.error) throw r.error;
        if (r.data.session) await navigate({ to: "/dashboard" });
        else setMessage("Check your email to confirm your account before signing in.");
      } else {
        const r = await supabase.auth.signInWithPassword({ email, password });
        if (r.error) throw r.error;
        await navigate({ to: "/dashboard" });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to access your account.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Site>
      <div className="auth-layout">
        <div className="auth-panel">
          <span className="eyebrow">Your next chapter</span>
          <h1 className="section-title">
            {mode === "signup"
              ? "Create your account."
              : mode === "forgot"
                ? "Reset your password."
                : "Welcome back."}
          </h1>
          <p className="section-copy mb-8">
            {mode === "signup"
              ? "Create your Rigor AI workspace."
              : "Intelligent Automation. Real Results."}
          </p>
          {message ? (
            <div role="status" className="border border-border rounded-lg p-5 text-sm text-success">
              {message}
              <Button variant="link" asChild className="mt-4">
                <Link to="/auth" search={{ mode: "login" }}>
                  Back to sign in
                </Link>
              </Button>
            </div>
          ) : (
            <form method="post" onSubmit={submit} className="space-y-5">
              {mode === "signup" && (
                <label className="form-field">
                  Full name
                  <input
                    name="name"
                    required
                    maxLength={120}
                    autoComplete="name"
                    className="field-control"
                    placeholder="Your full name"
                  />
                </label>
              )}
              <label className="form-field">
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="field-control"
                  placeholder="you@company.com"
                />
              </label>
              {mode !== "forgot" && (
                <label className="form-field">
                  Password
                  <div className="relative">
                    <input
                      name="password"
                      type={show ? "text" : "password"}
                      required
                      minLength={8}
                      autoComplete={mode === "signup" ? "new-password" : "current-password"}
                      className="field-control pr-12"
                      placeholder="At least 8 characters"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1"
                      aria-label={show ? "Hide password" : "Show password"}
                      onClick={() => setShow(!show)}
                    >
                      {show ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </label>
              )}
              {mode === "login" && (
                <div className="text-right">
                  <Link to="/auth" search={{ mode: "forgot" }} className="text-xs text-electric">
                    Forgot password?
                  </Link>
                </div>
              )}
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button variant="brand" className="w-full" disabled={busy || !ready}>
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "forgot"
                      ? "Send reset link"
                      : "Log in"}
                <ArrowUpRight />
              </Button>
            </form>
          )}
          <p className="mt-7 text-xs text-muted-foreground text-center">
            {mode === "signup" ? "Already have an account?" : "New to Rigor AI?"}{" "}
            <Link
              to="/auth"
              search={{ mode: mode === "signup" ? "login" : "signup" }}
              className="text-electric"
            >
              {mode === "signup" ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </Site>
  );
}
