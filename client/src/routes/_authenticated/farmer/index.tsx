import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Package, Egg, AlertCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { listMyListings } from "@/lib/listings.functions";
import { listFarmerOrders } from "@/lib/orders.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/farmer/")({
  component: FarmerDashboard,
});

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "bg-muted text-muted-foreground" },
  pending_pricing: { label: "Awaiting price", tone: "bg-warning/25 text-warning-foreground" },
  live: { label: "Live", tone: "bg-success/20 text-success" },
  sold_out: { label: "Sold out", tone: "bg-secondary text-secondary-foreground" },
  archived: { label: "Archived", tone: "bg-muted text-muted-foreground" },
};

function FarmerDashboard() {
  useRequireRole(["farmer"]);
  const listingsFn = useServerFn(listMyListings);
  const ordersFn = useServerFn(listFarmerOrders);
  const lq = useQuery({ queryKey: ["my-listings"], queryFn: () => listingsFn() });
  const oq = useQuery({ queryKey: ["farmer-orders"], queryFn: () => ordersFn() });

  const listings = lq.data ?? [];
  const orders = oq.data ?? [];
  const pendingOrders = orders.filter((o: any) => o.status === "pending");
  const placedOrders = orders.filter((o: any) => o.status === "placed");
  const fulfilledOrders = orders.filter((o: any) => o.status === "fulfilled");

  const totalPayout = fulfilledOrders.reduce(
    (s: number, it: any) => s + Number(it.unit_farmer_price) * it.quantity,
    0,
  );
  const totalSold = fulfilledOrders.reduce((s: number, it: any) => s + it.quantity, 0);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-primary">Farmer dashboard</h1>
            <p className="mt-1 text-muted-foreground">Track your orders and payouts.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat icon={Package} label="Active listings" value={listings.filter((l: any) => l.status === "live").length.toString()} />
          <Stat icon={Egg} label="Birds sold" value={totalSold.toString()} />
          <Stat icon={AlertCircle} label="Your earnings" value={formatPrice(totalPayout)} accent />
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground flex items-center gap-2">
          Pending Orders <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs text-warning-foreground font-semibold">{pendingOrders.length}</span>
        </h2>
        {oq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : pendingOrders.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground bg-secondary/35 p-4 rounded-xl border border-border">No pending orders.</div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingOrders.map((it: any) => (
              <div key={it.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-card transition duration-200">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Order ID</span>
                    <span className="font-mono text-sm text-foreground">#{it.order_id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Date</span>
                    <span className="text-xs text-foreground">{formatDate(it.created_at)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Quantity</span>
                    <span className="text-sm font-semibold text-foreground">{it.quantity}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Pending Payout</span>
                    <span className="text-sm font-bold text-accent">{formatPrice(Number(it.unit_farmer_price) * it.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground flex items-center gap-2">
          Placed Orders <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-500 font-semibold">{placedOrders.length}</span>
        </h2>
        {oq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : placedOrders.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground bg-secondary/35 p-4 rounded-xl border border-border">No placed orders yet.</div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {placedOrders.map((it: any) => (
              <div key={it.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-card transition duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-border/50">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Order ID</span>
                      <span className="font-mono text-sm text-foreground">#{it.order_id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Placed Date</span>
                      <span className="text-xs text-foreground">{formatDate(it.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Quantity</span>
                      <span className="text-sm font-semibold text-foreground">{it.quantity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Your Payout</span>
                      <span className="text-sm font-bold text-primary">{formatPrice(Number(it.unit_farmer_price) * it.quantity)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-secondary/30 p-3 rounded-xl border border-border/50 text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Delivery details</span>
                  {it.delivery ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{it.delivery.full_name} ({it.delivery.mobile})</div>
                      <div className="text-muted-foreground">
                        {it.delivery.address}, {it.delivery.city}, {it.delivery.district}, {it.delivery.state} - {it.delivery.pincode}
                        {it.delivery.landmark && <div className="text-primary/70 font-medium mt-0.5">Landmark: {it.delivery.landmark}</div>}
                        {it.delivery.notes && <div className="italic text-primary/80 mt-0.5 font-medium">Notes: {it.delivery.notes}</div>}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground flex items-center gap-2">
          Fulfilled Orders <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs text-success font-semibold">{fulfilledOrders.length}</span>
        </h2>
        {oq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : fulfilledOrders.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground bg-secondary/35 p-4 rounded-xl border border-border">No fulfilled orders yet.</div>
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {fulfilledOrders.map((it: any) => (
              <div key={it.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft hover:shadow-card transition duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-border/50">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Order ID</span>
                      <span className="font-mono text-sm text-foreground">#{it.order_id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Fulfilled Date</span>
                      <span className="text-xs text-foreground">{formatDate(it.created_at)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Quantity</span>
                      <span className="text-sm font-semibold text-foreground">{it.quantity}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Your Payout</span>
                      <span className="text-sm font-bold text-primary">{formatPrice(Number(it.unit_farmer_price) * it.quantity)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-secondary/30 p-3 rounded-xl border border-border/50 text-xs">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Delivery details</span>
                  {it.delivery ? (
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{it.delivery.full_name} ({it.delivery.mobile})</div>
                      <div className="text-muted-foreground">
                        {it.delivery.address}, {it.delivery.city}, {it.delivery.district}, {it.delivery.state} - {it.delivery.pincode}
                        {it.delivery.landmark && <div className="text-primary/70 font-medium mt-0.5">Landmark: {it.delivery.landmark}</div>}
                        {it.delivery.notes && <div className="italic text-primary/80 mt-0.5 font-medium">Notes: {it.delivery.notes}</div>}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-soft ${accent ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-accent text-accent-foreground" : "bg-secondary text-primary"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
