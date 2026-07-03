import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sprout, Store, BarChart3, ArrowRight, CheckCircle2, ArrowUpRight, Calendar, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { SiteFooter } from "@/components/site-footer";
import heroImg from "@/assets/hero-farm.png";
import { getMarketRatesData } from "@/lib/market-rates.functions";
import { formatDate } from "@/lib/format";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [selectedHistoryCategory, setSelectedHistoryCategory] = useState<string | null>(null);

  const ratesQuery = useQuery({
    queryKey: ["public-market-rates"],
    queryFn: getMarketRatesData,
  });

  const historyForSelected = useMemo(() => {
    if (!selectedHistoryCategory || !ratesQuery.data?.history) return [];
    return ratesQuery.data.history
      .map((h) => {
        const matchingRate = h.rates.find(
          (r) => r.weight_category.toLowerCase() === selectedHistoryCategory.toLowerCase()
        );
        return {
          date: h.date,
          price: matchingRate ? matchingRate.price : null,
          market_name: h.market_name,
        };
      })
      .filter((item) => item.price !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedHistoryCategory, ratesQuery.data?.history]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Premium ambient light glow effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/4 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1/4 top-1/3 -z-10 h-[500px] w-[500px] rounded-full bg-accent/8 blur-[100px]"
      />

      <AppHeader />

      {/* Hero */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32">
        <div className="container mx-auto grid items-center gap-12 px-6 md:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start text-left"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary shadow-soft backdrop-blur-sm"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              Vetted & Admin-Approved Traders
            </motion.span>

            <h1 className="mt-6 font-display text-4xl font-black leading-[1.1] tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-[4rem]">
              Poultry trading, <br />
              <span className="bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent">done right.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Henhouse is a controlled marketplace connecting verified farmers and approved buyers.
              Get fair, consistent market prices set by administrative oversight with transparent order tracking.
            </p>

            <div className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto">
              <Button variant="hero" size="lg" className="group shadow-card w-full sm:w-auto rounded-xl h-12" asChild>
                <Link to="/auth" search={{ mode: "signup", role: "farmer" } as any}>
                  Sell as a Farmer
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto rounded-xl h-12 border-primary/10 hover:border-primary/30 transition-all shadow-soft"
                asChild
              >
                <Link to="/auth" search={{ mode: "signup", role: "buyer" } as any}>
                  Buy Poultry & Feed
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-border/60 pt-6 w-full text-sm text-muted-foreground">
              {["Vetted accounts", "Transparent pricing", "Order tracking"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Soft backdrop glow behind image */}
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-hero opacity-[0.15] blur-2xl" />

            <div className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card p-2 shadow-card">
              <img
                src={heroImg}
                alt="Poultry farmer holding a healthy hen at golden hour"
                width={1600}
                height={1100}
                className="aspect-[4/3] w-full object-cover rounded-2xl md:aspect-[5/4]"
              />
              <div className="pointer-events-none absolute inset-2 rounded-2xl bg-gradient-to-t from-black/30 via-black/0 to-black/0" />
            </div>

            {/* floating metric badge */}
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-border bg-card/90 px-6 py-4 shadow-card backdrop-blur-md md:block hover:scale-105 transition duration-300">
              <div className="font-display text-4xl font-extrabold text-primary">2,400+</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Birds Sold This Season</div>
            </div>
          </motion.div>
        </div>
      </section>
 
      {/* Bihar Market Rates Section */}
      <section className="py-16 md:py-24 border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center md:text-left md:flex md:items-end md:justify-between gap-6 mb-10">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Live Broiler Rates
                </span>
                <h2 className="font-display text-3xl font-black tracking-tight text-primary md:text-4xl">
                  {ratesQuery.data?.metadata?.name || "Bihar Market Rates"}
                </h2>
                <p className="mt-2 text-muted-foreground text-sm max-w-xl">
                  Official daily weight-wise broiler market rates. Updated in real-time by administrators.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex flex-wrap justify-center md:justify-end gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border/60 text-foreground font-medium shadow-soft">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Market Date: <span className="font-bold text-primary">{ratesQuery.data?.metadata?.date ? formatDate(ratesQuery.data.metadata.date) : "—"}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border/60 text-foreground font-medium shadow-soft">
                  🚚 Vehicles Arrived: <span className="font-bold text-primary">{ratesQuery.data?.metadata?.vehicles_arrived ?? 0}</span>
                </div>
              </div>
            </div>

            {ratesQuery.isLoading ? (
              <div className="rounded-3xl border border-border bg-card/50 p-12 text-center shadow-soft">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="mt-4 text-sm text-muted-foreground font-medium">Loading rate board...</p>
              </div>
            ) : !ratesQuery.data?.rates || ratesQuery.data.rates.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-soft">
                <span className="text-3xl">📊</span>
                <p className="mt-4 font-display text-lg font-bold text-foreground">No rates listed today</p>
                <p className="mt-1 text-sm text-muted-foreground">Bihar market rates haven't been published for today yet. Please check back later.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <th className="p-4 pl-6">Weight Category</th>
                        <th className="p-4 text-center">Today (₹/kg)</th>
                        <th className="p-4 text-center">Yesterday (₹/kg)</th>
                        <th className="p-4 text-center">Change</th>
                        <th className="p-4 pr-6 text-center">History</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {ratesQuery.data.rates.map((r) => {
                        const diff = r.today_price - r.yesterday_price;
                        return (
                          <tr key={r._id} className="hover:bg-secondary/20 transition-colors duration-150">
                            <td className="p-4 pl-6 font-semibold text-foreground">
                              {r.weight_category}
                            </td>
                            <td className="p-4 text-center font-bold text-primary">
                              ₹{r.today_price}
                            </td>
                            <td className="p-4 text-center text-muted-foreground font-medium">
                              ₹{r.yesterday_price}
                            </td>
                            <td className="p-4 text-center">
                              {diff > 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                                  <TrendingUp className="h-3 w-3" /> ▲ +{diff}
                                </span>
                              ) : diff < 0 ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full">
                                  <TrendingDown className="h-3 w-3" /> ▼ {diff}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                  <Minus className="h-3 w-3" /> 0
                                </span>
                              )}
                            </td>
                            <td className="p-4 pr-6 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedHistoryCategory(r.weight_category)}
                                className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-primary hover:bg-secondary cursor-pointer"
                                title="View historical trends"
                              >
                                <History className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section className="border-t border-border/40 py-20 md:py-28 bg-secondary/10 backdrop-blur-[2px]">
        <div className="container mx-auto px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-black tracking-tight text-primary md:text-4xl">
              Built for everyone in the supply chain
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three specialized roles, one source of truth. Every sale is logged, every account is vetted.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Sprout,
                title: "Farmers",
                body: "Register your farm, list birds or eggs with your own price, and fulfill orders once approved.",
              },
              {
                icon: Store,
                title: "Buyers",
                body: "Browse a curated catalog of vetted listings. Buy at transparent prices with instant order tracking.",
              },
              {
                icon: BarChart3,
                title: "Admins",
                body: "Approve accounts, manage daily pricing rates, monitor stock levels, and oversee platform fulfillment.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="group relative rounded-3xl border border-border bg-card p-8 shadow-soft hover:shadow-card transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold text-foreground">
                    {c.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary/80 group-hover:text-primary">
                  <span>Learn onboarding</span>
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border/40 bg-card py-20 md:py-28">
        <div className="container mx-auto grid gap-12 px-6 md:grid-cols-2 md:gap-20 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Workflow</span>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-primary md:text-4xl leading-tight">
              A highly controlled, secure trading environment
            </h2>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              A structured approval and pricing model keeps the marketplace fair, transparent, and profitable for both sides.
            </p>
            <div className="mt-8">
              <Button variant="outline" className="rounded-xl border-border/80" asChild>
                <Link to="/about">Read Detailed Process</Link>
              </Button>
            </div>
          </div>
          <ol className="space-y-8 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-border/60">
            {[
              {
                t: "Register & Get Verified",
                d: "Submit your details. Admins review and approve accounts within 24-48 hours to prevent fraud.",
              },
              {
                t: "Listings & Price Moderation",
                d: "Farmers list their livestock asking price; Admins set buyer-facing prices for stable market margins.",
              },
              {
                t: "Secure Orders & Tracking",
                d: "Buyers pay securely at transparent rates and track each order from payment to doorstep delivery.",
              },
            ].map((s, i) => (
              <li key={s.t} className="group relative flex gap-6 pl-1 text-left">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-primary shadow-soft border border-border transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 z-10">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-base">{s.t}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 text-center md:py-32">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[400px] bg-gradient-hero opacity-[0.06] blur-[120px]"
        />
        <div className="container relative mx-auto px-6">
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-black tracking-tight text-primary md:text-5xl leading-tight">
            Ready to join the new <br />
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">poultry marketplace?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground text-sm sm:text-base">
            Create an account today to sell livestock or purchase vetted high-quality stock.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button variant="hero" size="lg" className="shadow-card w-full sm:w-auto rounded-xl" asChild>
              <Link to="/auth" search={{ mode: "signup" } as any}>Create Your Account</Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl" asChild>
              <Link to="/about">How It Works</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Category History Dialog */}
      <Dialog open={selectedHistoryCategory !== null} onOpenChange={(open) => { if (!open) setSelectedHistoryCategory(null); }}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-primary">Rate History</DialogTitle>
            <DialogDescription>
              Historical broiler rates for category: <span className="font-semibold text-foreground">{selectedHistoryCategory}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[300px] overflow-y-auto rounded-xl border border-border bg-secondary/10">
            {historyForSelected.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No historical records found for this category.
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border bg-secondary/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-3 pl-4">Date</th>
                    <th className="p-3">Market</th>
                    <th className="p-3 pr-4 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {historyForSelected.map((h, i) => (
                    <tr key={i} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3 pl-4 font-medium text-foreground">{formatDate(h.date)}</td>
                      <td className="p-3 text-xs text-muted-foreground">{h.market_name}</td>
                      <td className="p-3 pr-4 text-right font-bold text-primary">₹{h.price}/kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setSelectedHistoryCategory(null)} variant="secondary" className="rounded-xl">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}