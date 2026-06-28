import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How it works — Henhouse" },
      { name: "description", content: "Learn how Henhouse vets farmers and buyers, sets fair prices, and keeps poultry trading transparent." },
      { property: "og:title", content: "How it works — Henhouse" },
      { property: "og:description", content: "A controlled marketplace with admin-set pricing." },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="font-display text-4xl font-semibold text-primary md:text-5xl">How Henhouse works</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Henhouse is built around one idea: trade should be fair, traceable, and friendly to
          both farmers and buyers. Every account is reviewed by our team, every listing is
          priced consistently, and every order is tracked end-to-end.
        </p>

        <section className="mt-10 space-y-8">
          {[
            { h: "1. Sign up & get verified", b: "Farmers tell us about their operation. Buyers tell us about their business. Our admins review and approve accounts within 24–48 hours." },
            { h: "2. Farmers list their birds", b: "Once approved, farmers create listings with quantity, breed, location, and their original selling price — which only they and the admin can see." },
            { h: "3. Admin sets the buyer price", b: "Our team reviews each listing, sets a fair buyer-facing price, and publishes it. This keeps pricing consistent across the marketplace." },
            { h: "4. Buyers browse & order", b: "Approved buyers see one transparent price per listing, place orders, and track status from placed → confirmed → fulfilled." },
            { h: "5. Inventory & analytics", b: "Stock decrements automatically with each sale. Admins monitor live analytics, low-stock alerts, and margin per farmer." },
          ].map((s) => (
            <div key={s.h} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-xl font-semibold text-foreground">{s.h}</h2>
              <p className="mt-2 text-muted-foreground">{s.b}</p>
            </div>
          ))}
        </section>

        <div className="mt-10">
          <Link to="/auth" search={{ mode: "signup" } as any} className="text-primary hover:underline">
            Create your account →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
