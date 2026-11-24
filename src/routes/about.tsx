import { createFileRoute, Link } from "@tanstack/react-router";
import { Site, Intro } from "@/components/site";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/metadata";
export const Route = createFileRoute("/about")({
  head: () =>
    pageHead(
      "About Rigor AI",
      "Our mission is to help businesses work smarter with intelligent automation and practical AI agents.",
    ),
  component: About,
});
function About() {
  return (
    <Site>
      <section className="section site-container">
        <Intro
          eyebrow={<span className="[word-spacing:0.25em]">ABOUT RIGOR AI</span>}
          title="Human ambition. Intelligent automation."
          description="We believe technology should give people their time back. Rigor AI brings AI-powered workflows, specialized agents, and application integrations into one connected workspace."
        />
        <div className="grid md:grid-cols-2 gap-16 mt-16">
          {[
            [
              "Our mission",
              "Make intelligent automation accessible to businesses of every size, so teams can focus on relationships, creativity, and growth.",
            ],
            [
              "Our vision",
              "A future where repetitive work runs reliably in the background and everyone has an intelligent teammate.",
            ],
            [
              "Why automation matters",
              "Manual tasks create delays and fragmented information. Connected workflows make repetitive processes consistent and results easier to understand.",
            ],
            [
              "AI that works with you",
              "Custom instructions and objectives help agents assist with communication, classification, and business questions—with real conversation history and transparent results.",
            ],
          ].map(([t, d]) => (
            <div key={t}>
              <h2 className="text-xl font-semibold mb-4">{t}</h2>
              <p className="section-copy">{d}</p>
            </div>
          ))}
        </div>
        <Button variant="brand" className="mt-12" asChild>
          <Link to="/contact">Let's build something smarter</Link>
        </Button>
      </section>
    </Site>
  );
}
