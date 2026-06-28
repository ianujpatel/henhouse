import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Package, Store } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { listMyOrders } from "@/lib/orders.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

const STATUS_TONES: Record<string, string> = {
  placed: "bg-secondary text-secondary-foreground",
  confirmed: "bg-warning/25 text-warning-foreground",
  fulfilled: "bg-success/20 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

function OrdersPage() {
  useRequireRole(["buyer", "admin"]);
  const fn = useServerFn(listMyOrders);
  const q = useQuery({ queryKey: ["my-orders"], queryFn: () => fn() });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-semibold text-primary">My orders</h1>
        <p className="mt-1 text-muted-foreground">Track every order from placement to fulfillment.</p>

        {q.isLoading ? (
          <div className="mt-10 text-muted-foreground">Loading…</div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-display text-xl text-foreground">No orders yet</p>
            <Button variant="hero" className="mt-5" asChild>
              <Link to="/marketplace"><Store className="h-4 w-4" /> Browse marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {(q.data ?? []).map((o: any) => (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Order</div>
                    <div className="font-mono text-sm">#{o.id.slice(0, 8)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Placed</div>
                    <div className="text-sm">{formatDate(o.placed_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Total</div>
                    <div className="font-display text-xl font-semibold text-primary">{formatPrice(o.total)}</div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_TONES[o.status]}`}>
                    {o.status}
                  </span>
                </div>
                <div className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                  {o.items?.length ?? 0} item{(o.items?.length ?? 0) === 1 ? "" : "s"}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
