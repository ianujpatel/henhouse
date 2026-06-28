import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listMarketplace } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/marketplace/")({
  component: MarketplacePage,
});

const CATEGORIES = ["all", "broiler", "layer", "chick", "egg", "other"] as const;

function MarketplacePage() {
  useRequireRole(["buyer", "admin"]);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const fn = useServerFn(listMarketplace);
  const q = useQuery({
    queryKey: ["marketplace", category, search],
    queryFn: () => fn({ data: { category, search } }),
  });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-primary">Marketplace</h1>
            <p className="mt-1 text-muted-foreground">Vetted listings, transparent pricing.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search listings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {q.isLoading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading listings…</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-xl text-foreground">No listings yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Check back soon — new birds are listed daily.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(q.data ?? []).map((l: any) => (
              <Link
                key={l.id}
                to="/marketplace/$id"
                params={{ id: l.id }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="aspect-[4/3] overflow-hidden bg-secondary">
                  {l.image_urls?.[0] ? (
                    <img src={l.image_urls[0]} alt={l.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center font-display text-3xl text-primary/30">🐓</div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs capitalize text-secondary-foreground">{l.category}</span>
                    <span className="text-xs text-muted-foreground">{l.quantity} {l.unit}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-foreground line-clamp-1">{l.title}</h3>
                  {l.location && <div className="text-xs text-muted-foreground">{l.location}</div>}
                  <div className="mt-4 flex items-baseline justify-between">
                    <div className="font-display text-2xl font-semibold text-primary">{formatPrice(l.buyer_price)}</div>
                    <span className="text-xs text-accent">per {l.unit}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
