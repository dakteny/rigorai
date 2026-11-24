import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowUpRight } from "lucide-react";
import { Site, Intro } from "@/components/site";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/metadata";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolvePlanAccess } from "@/lib/plan-access";
export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead(
      "Plans & Pricing",
      "Explore the Free, Pro and Business plans for Rigor AI intelligent automation.",
    ),
  component: Pricing,
});
export function Plans() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { data: access } = useQuery({
    queryKey: ["public-plan-access"],
    enabled: hydrated,
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return resolvePlanAccess([]);
      const [roles, profile] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id),
        supabase.from("profiles").select("disabled").eq("id", data.user.id).single(),
      ]);
      if (roles.error || profile.error || profile.data.disabled) return resolvePlanAccess([]);
      return resolvePlanAccess(roles.data);
    },
  });
  const isAdmin = access?.isAdministrator === true;
  return (
    <div className="service-grid">
      {[
        {
          name: "Free",
          price: "$0",
          caption: "A smarter place to start.",
          features: [
            "Workflow configuration",
            "Basic integrations",
            "AI agent configuration",
            "Your private dashboard",
          ],
        },
        {
          name: "Pro",
          price: "Coming soon",
          caption: "More power for growing teams.",
          features: [
            "More automation capacity",
            "Advanced integrations",
            "Increased AI usage",
            "Advanced analytics",
            "Priority support",
          ],
        },
        {
          name: "Business",
          price: "Let’s talk",
          caption: "Intelligence at your scale.",
          features: [
            "Higher automation capacity",
            "Advanced AI agents",
            "Team collaboration",
            "Custom integrations",
            "Dedicated support",
          ],
        },
      ].map((p) => (
        <article className="service-card plan-card" key={p.name}>
          <span className="eyebrow">{p.name}</span>
          <h3 className="text-3xl">{isAdmin ? "Included" : p.price}</h3>
          {isAdmin && <span className="text-xs text-success">Administrator access</span>}
          <p>{p.caption}</p>
          <ul className="space-y-4 my-8">
            {p.features.map((f) => (
              <li key={f} className="text-xs flex gap-2">
                <Check size={14} className="text-electric" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="brand" asChild>
            {isAdmin ? (
              <Link to="/billing">
                Open {p.name} access <ArrowUpRight />
              </Link>
            ) : p.name === "Free" ? (
              <Link to="/auth" search={{ mode: "signup" }}>
                Get Started Free <ArrowUpRight />
              </Link>
            ) : (
              <Link to="/contact">
                {p.name === "Pro" ? "Join the waitlist" : "Contact sales"} <ArrowUpRight />
              </Link>
            )}
          </Button>
        </article>
      ))}
    </div>
  );
}
function Pricing() {
  return (
    <Site>
      <section className="section site-container">
        <Intro
          eyebrow="Room to grow"
          title="Start small. Think bigger."
          description="Start with a Free workspace. Pro and Business subscriptions will be available after payment configuration; no payment is collected here."
        />
        <Plans />
      </section>
    </Site>
  );
}
