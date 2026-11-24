import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Cpu, Menu, X } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
export function Brand() {
  return (
    <Link to="/" className="brand">
      <span className="brand-mark">
        <Cpu size={34} />
      </span>
      <span>
        rigor<span className="text-electric">ai</span>
        <span className="text-electric">.</span>
      </span>
    </Link>
  );
}
export function Site({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const { data: user } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const r = await supabase.auth.getUser();
      return r.data.user;
    },
    enabled: hydrated,
    staleTime: 30000,
  });
  return (
    <>
      <header className="border-b border-border">
        <div className="site-container site-nav">
          <Brand />
          <nav className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/services">Solutions</Link>
            <Link to="/about">About Us</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="brand" asChild>
                <Link to="/dashboard">
                  My workspace <ArrowUpRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild className="hidden sm:inline-flex">
                  <Link to="/auth" search={{ mode: "login" }}>
                    Log in
                  </Link>
                </Button>
                <Button variant="brand" asChild>
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Get Started <ArrowUpRight />
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav className="site-container flex flex-col gap-5 pb-6 text-sm">
            <Link to="/services">Solutions</Link>
            <Link to="/about">About Us</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
            {user ? (
              <Link to="/dashboard">My workspace</Link>
            ) : (
              <Link to="/auth" search={{ mode: "login" }}>
                Log in
              </Link>
            )}
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="site-container flex flex-wrap items-start justify-between gap-8">
          <div>
            <Brand />
            <p className="mt-3 text-xs text-muted-foreground">
              Intelligent Automation. Real Results.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-muted-foreground">
            <Link to="/about">About</Link>
            <Link to="/services">Solutions</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 Rigor AI. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
export function Intro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="section-title">{title}</h1>
      <p className="section-copy">{description}</p>
    </div>
  );
}
