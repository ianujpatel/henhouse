import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Henhouse" },
      { name: "description", content: "Get in touch with the Henhouse team for partnerships, support, or onboarding help." },
      { property: "og:title", content: "Contact — Henhouse" },
      { property: "og:description", content: "Get in touch with the Henhouse team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-semibold text-primary md:text-5xl">Contact us</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Have a question about onboarding, pricing, or partnerships? We typically reply within
          one business day.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { icon: Mail, label: "Email", value: "hello@henhouse.farm" },
            { icon: Phone, label: "Phone", value: "+234 800 000 0000" },
            { icon: MapPin, label: "Office", value: "Lagos, Nigeria" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <c.icon className="h-5 w-5 text-accent" />
              <div className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{c.label}</div>
              <div className="mt-1 font-medium text-foreground">{c.value}</div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
