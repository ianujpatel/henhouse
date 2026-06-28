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
            <p className="mt-1 text-muted-foreground">Manage your listings, track your payouts.</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/farmer/listings/new"><Plus className="h-4 w-4" /> New listing</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Stat icon={Package} label="Active listings" value={listings.filter((l: any) => l.status === "live").length.toString()} />
          <Stat icon={Egg} label="Birds sold" value={totalSold.toString()} />
          <Stat icon={AlertCircle} label="Your earnings" value={formatPrice(totalPayout)} accent />
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground">Your listings</h2>
        {lq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : listings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-xl text-foreground">No listings yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Create your first listing to start selling.</p>
            <Button variant="hero" className="mt-5" asChild>
              <Link to="/farmer/listings/new"><Plus className="h-4 w-4" /> New listing</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3">Your price</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l: any) => {
                  const s = STATUS_LABEL[l.status] ?? STATUS_LABEL.draft;
                  return (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-5 py-4 font-medium text-foreground">{l.title}</td>
                      <td className="px-5 py-4 capitalize text-muted-foreground">{l.category}</td>
                      <td className="px-5 py-4">{l.quantity} {l.unit}</td>
                      <td className="px-5 py-4">{formatPrice(l.farmer_price)}</td>
                      <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs ${s.tone}`}>{s.label}</span></td>
                      <td className="px-5 py-4 text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/farmer/listings/$id/edit" params={{ id: l.id }}>Edit</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground flex items-center gap-2">
          Pending Orders <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs text-warning-foreground font-medium">{pendingOrders.length}</span>
        </h2>
        {oq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : pendingOrders.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground bg-secondary/35 p-4 rounded-xl border border-border">No pending orders.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3 font-semibold">Pending payout</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map((it: any) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="px-5 py-4">{formatDate(it.created_at)}</td>
                    <td className="px-5 py-4 font-mono text-xs">#{it.order_id.slice(0, 8)}</td>
                    <td className="px-5 py-4">{it.quantity}</td>
                    <td className="px-5 py-4 font-semibold text-muted-foreground">{formatPrice(Number(it.unit_farmer_price) * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground flex items-center gap-2">
          Placed Orders <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-500 font-medium">{placedOrders.length}</span>
        </h2>
        {oq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : placedOrders.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground bg-secondary/35 p-4 rounded-xl border border-border">No placed orders yet.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3 font-semibold">Your payout</th>
                  <th className="px-5 py-3">Delivery details</th>
                </tr>
              </thead>
              <tbody>
                {placedOrders.map((it: any) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="px-5 py-4">{formatDate(it.created_at)}</td>
                    <td className="px-5 py-4 font-mono text-xs">#{it.order_id.slice(0, 8)}</td>
                    <td className="px-5 py-4">{it.quantity}</td>
                    <td className="px-5 py-4 font-semibold text-primary">{formatPrice(Number(it.unit_farmer_price) * it.quantity)}</td>
                    <td className="px-5 py-4 text-xs">
                      {it.delivery ? (
                        <div>
                          <div className="font-semibold text-foreground">{it.delivery.full_name} ({it.delivery.mobile})</div>
                          <div className="text-muted-foreground">
                            {it.delivery.address}, {it.delivery.city}, {it.delivery.district}, {it.delivery.state} - {it.delivery.pincode}
                            {it.delivery.landmark && <div>Landmark: {it.delivery.landmark}</div>}
                            {it.delivery.notes && <div className="italic text-primary/80 mt-0.5">Notes: {it.delivery.notes}</div>}
                          </div>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold text-foreground flex items-center gap-2">
          Fulfilled Orders <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs text-success font-medium">{fulfilledOrders.length}</span>
        </h2>
        {oq.isLoading ? (
          <div className="mt-4 text-muted-foreground">Loading…</div>
        ) : fulfilledOrders.length === 0 ? (
          <div className="mt-4 text-sm text-muted-foreground bg-secondary/35 p-4 rounded-xl border border-border">No fulfilled orders yet.</div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Order ID</th>
                  <th className="px-5 py-3">Qty</th>
                  <th className="px-5 py-3 font-semibold">Your payout</th>
                  <th className="px-5 py-3">Delivery details</th>
                </tr>
              </thead>
              <tbody>
                {fulfilledOrders.map((it: any) => (
                  <tr key={it.id} className="border-t border-border">
                    <td className="px-5 py-4">{formatDate(it.created_at)}</td>
                    <td className="px-5 py-4 font-mono text-xs">#{it.order_id.slice(0, 8)}</td>
                    <td className="px-5 py-4">{it.quantity}</td>
                    <td className="px-5 py-4 font-semibold text-primary">{formatPrice(Number(it.unit_farmer_price) * it.quantity)}</td>
                    <td className="px-5 py-4 text-xs">
                      {it.delivery ? (
                        <div>
                          <div className="font-semibold text-foreground">{it.delivery.full_name} ({it.delivery.mobile})</div>
                          <div className="text-muted-foreground">
                            {it.delivery.address}, {it.delivery.city}, {it.delivery.district}, {it.delivery.state} - {it.delivery.pincode}
                            {it.delivery.landmark && <div>Landmark: {it.delivery.landmark}</div>}
                            {it.delivery.notes && <div className="italic text-primary/80 mt-0.5">Notes: {it.delivery.notes}</div>}
                          </div>
                        </div>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
