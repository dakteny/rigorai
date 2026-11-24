import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Mail, CheckCircle } from "lucide-react";
import { Site, Intro } from "@/components/site";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/catalog";
import { pageHead } from "@/lib/metadata";
import { contactSubmit } from "@/lib/platform.functions";
export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead(
      "Contact Rigor AI",
      "Tell us what you would like to automate and start a conversation with Rigor AI.",
    ),
  component: Contact,
});
function Contact() {
  const send = useServerFn(contactSubmit);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await send({
        data: {
          name: String(f.get("name")),
          email: String(f.get("email")),
          company: String(f.get("company")),
          service: String(f.get("service")),
          message: String(f.get("message")),
        },
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Message could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Site>
      <section className="section site-container grid gap-16 md:grid-cols-2">
        <div>
          <Intro
            eyebrow="Let's connect"
            title="What could work smarter?"
            description="Tell us about your business, your goals, and the work you’d love to take off your plate."
          />
          <Mail className="mt-10 text-electric" size={35} />
          <h2 className="mt-5 text-lg font-semibold">Big ideas start with a conversation.</h2>
          <p className="section-copy mt-3">
            From your first workflow to a custom AI solution, let's find your next step.
          </p>
        </div>
        {sent ? (
          <div role="status" className="empty-state">
            <CheckCircle className="text-success" size={36} />
            <h2 className="text-xl text-foreground">Message received.</h2>
            <p>Your enquiry has been securely saved for our team.</p>
            <Button variant="outline" onClick={() => setSent(false)}>
              Send another message
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {[
              ["name", "Full name", "text"],
              ["email", "Email address", "email"],
              ["company", "Company (optional)", "text"],
            ].map(([name, label, type]) => (
              <label className="form-field" key={name}>
                {label}
                <input
                  name={name}
                  type={type}
                  required={name !== "company"}
                  maxLength={150}
                  className="field-control"
                />
              </label>
            ))}
            <label className="form-field">
              Service required
              <select name="service" required className="field-control">
                <option value="">Select a solution</option>
                {services.map((s) => (
                  <option key={s.name}>{s.name}</option>
                ))}
                <option>Pro plan waitlist</option>
                <option>Business plan enquiry</option>
              </select>
            </label>
            <label className="form-field">
              Your message
              <textarea
                name="message"
                required
                maxLength={5000}
                rows={5}
                className="field-control"
                placeholder="Tell us what you have in mind…"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button variant="brand" disabled={busy}>
              {busy ? "Sending…" : "Send message"}
              <ArrowUpRight />
            </Button>
          </form>
        )}
      </section>
    </Site>
  );
}
