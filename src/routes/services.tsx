import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Check } from "lucide-react";
import { Site, Intro } from "@/components/site";
import { Button } from "@/components/ui/button";
import { services } from "@/lib/catalog";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/services")({
  head: () =>
    pageHead(
      "Automation Solutions",
      "Explore Rigor AI business automation, customer support agents, email, e-commerce and custom AI solutions.",
    ),
  component: Services,
});
function Services() {
  return (
    <Site>
      <section className="section site-container">
        <Intro
          eyebrow="Our solutions"
          title="Intelligence for every part of your business."
          description="Less repetitive work. More time for the work that matters. Discover the right automation for your next step."
        />
        <div className="service-grid">
          {services.map((s) => (
            <article className="service-card" key={s.name}>
              <span className="service-icon">
                <s.icon size={22} />
              </span>
              <h3>{s.name}</h3>
              <p>{s.description}</p>
              <ul className="my-5 space-y-3">
                {s.benefits.map((b) => (
                  <li key={b} className="flex gap-2 text-xs text-muted-foreground">
                    <Check size={13} className="text-electric" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button variant="outline" asChild>
                <Link to="/contact">
                  Discuss your project <ArrowUpRight />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </Site>
  );
}
