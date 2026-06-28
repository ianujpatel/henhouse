import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sprout, Store, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero-farm.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Henhouse — Trusted Poultry Marketplace" },
      {
        name: "description",
        content:
          "A controlled poultry marketplace connecting approved farmers and buyers, with admin-managed pricing and inventory.",
      },
      { property: "og:title", content: "Henhouse — Trusted Poultry Marketplace" },
      {
        property: "og:description",
        content:
          "A controlled poultry marketplace connecting approved farmers and buyers, with admin-managed pricing and inventory.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <AppHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-secondary/60 px-3 py-1 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin-verified farmers & buyers
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-primary md:text-6xl">
              Poultry trading, <span className="text-accent">done right.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Henhouse is a controlled marketplace where vetted farmers list their birds and
              eggs, and approved buyers purchase at fair, consistent prices set by our team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup", role: "farmer" } as any}>
                  Sell as a farmer <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/auth" search={{ mode: "signup", role: "buyer" } as any}>
                  Buy from farmers
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Vetted accounts", "Transparent pricing", "Order tracking"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-hero opacity-20 blur-2xl" />
            <img
              src={heroImg}
              alt="Poultry farmer holding a healthy hen at golden hour"
              width={1600}
              height={1100}
              className="relative rounded-[1.5rem] border border-primary/10 shadow-card"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-card md:block">
              <div className="font-display text-3xl font-semibold text-primary">2,400+</div>
              <div className="text-xs text-muted-foreground">birds sold this season</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Roles */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold text-primary md:text-4xl">
            Built for everyone in the supply chain
          </h2>
          <p className="mt-3 text-muted-foreground">
            Three roles, one source of truth. Every sale is logged, every account is verified.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Sprout,
              title: "Farmers",
              body: "Register your farm, list your poultry with your own price, and ship orders once you're approved.",
            },
            {
              icon: Store,
              title: "Buyers",
              body: "Browse a curated catalog of vetted listings. One transparent price. Order tracking from placement to fulfillment.",
            },
            {
              icon: BarChart3,
              title: "Admin",
              body: "Approve accounts, set buyer-facing prices, monitor inventory, and steer the platform with live analytics.",
            },
          ].map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">
                {c.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/60 bg-secondary/30 py-16">
        <div className="container mx-auto grid gap-12 px-4 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-semibold text-primary md:text-4xl">
              How it works
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              A clear, controlled flow keeps the marketplace fair for everyone.
            </p>
          </div>
          <ol className="space-y-5">
            {[
              {
                t: "Register & get approved",
                d: "Tell us about you and your farm or business. Our team reviews every account before granting access.",
              },
              {
                t: "Farmers list, admin prices",
                d: "Farmers set their own asking price; the admin sets the final buyer-facing price to keep margins fair.",
              },
              {
                t: "Buyers order with confidence",
                d: "Browse live listings at one transparent price and track each order through fulfillment.",
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground shadow-soft">
                  {i + 1}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{s.t}</div>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold text-primary md:text-5xl">
          Ready to join the new poultry marketplace?
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button variant="hero" size="lg" asChild>
            <Link to="/auth" search={{ mode: "signup" } as any}>Create your account</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link to="/about">How it works</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
