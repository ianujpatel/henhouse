import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getListingForBuyer } from "@/lib/listings.functions";
import { placeOrder } from "@/lib/orders.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatPrice } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/marketplace/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  useRequireRole(["buyer", "admin"]);
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getListingForBuyer);
  const placeFn = useServerFn(placeOrder);
  const q = useQuery({ queryKey: ["listing", id], queryFn: () => getFn({ data: { id } }) });
  const [qty, setQty] = useState(1);
  const [placing, setPlacing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({
    fullName: "",
    mobile: "",
    alternateMobile: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    district: "",
    pincode: "",
    notes: "",
  });

  if (q.isLoading) {
    return (
      <div><AppHeader /><div className="container mx-auto px-4 py-12 text-muted-foreground">Loading…</div></div>
    );
  }
  if (!q.data) return null;
  const l = q.data;
  const total = Number(l.buyer_price) * qty;

  async function handleOrderSubmit() {
    setPlacing(true);
    try {
      await placeFn({
        data: {
          items: [{ listing_id: id, quantity: qty }],
          delivery: {
            fullName: deliveryDetails.fullName,
            mobile: deliveryDetails.mobile,
            alternateMobile: deliveryDetails.alternateMobile,
            address: deliveryDetails.address,
            landmark: deliveryDetails.landmark,
            city: deliveryDetails.city,
            state: deliveryDetails.state,
            district: deliveryDetails.district,
            pincode: deliveryDetails.pincode,
            notes: deliveryDetails.notes,
          }
        }
      });
      toast.success("Order placed");
      setDialogOpen(false);
      navigate({ to: "/orders" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not place order");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        <Link to="/marketplace" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to marketplace
        </Link>
        <div className="mt-6 grid gap-10 md:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-secondary shadow-card">
            {l.image_urls?.[0] ? (
              <img src={l.image_urls[0]} alt={l.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center font-display text-7xl text-primary/30">🐓</div>
            )}
          </div>
          <div>
            <span className="rounded-full bg-secondary px-2.5 py-1 text-xs capitalize text-secondary-foreground">{l.category}</span>
            <h1 className="mt-4 font-display text-4xl font-semibold text-primary">{l.title}</h1>
            {l.breed && <div className="mt-1 text-muted-foreground">{l.breed}</div>}
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {l.location && (
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {l.location}</span>
              )}
              <span className="inline-flex items-center gap-1.5"><Package className="h-4 w-4" /> {l.quantity} {l.unit} available</span>
            </div>
            {l.description && <p className="mt-6 whitespace-pre-line text-foreground/90">{l.description}</p>}

            <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-3xl font-semibold text-primary">{formatPrice(l.buyer_price)}</div>
                <span className="text-sm text-muted-foreground">per {l.unit}</span>
              </div>
              <div className="mt-5 flex items-end gap-3">
                <div className="flex-1">
                  <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                  <Input
                    type="number"
                    min={1}
                    max={l.quantity}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(l.quantity, Number(e.target.value))))}
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-display text-2xl font-semibold text-foreground">{formatPrice(total)}</div>
                </div>
              </div>
              <Button variant="hero" size="lg" className="mt-5 w-full" onClick={() => setDialogOpen(true)}>
                Place order
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-primary">Delivery Details</DialogTitle>
            <DialogDescription>Please provide your complete shipping details to place the order.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleOrderSubmit(); }} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                <Input
                  required
                  value={deliveryDetails.fullName}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, fullName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Mobile Number *</label>
                <Input
                  required
                  value={deliveryDetails.mobile}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Alternate Number (Optional)</label>
                <Input
                  value={deliveryDetails.alternateMobile}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, alternateMobile: e.target.value })}
                  placeholder="Alternate number"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">PIN Code *</label>
                <Input
                  required
                  value={deliveryDetails.pincode}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, pincode: e.target.value })}
                  placeholder="6-digit PIN code"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Full Address *</label>
              <textarea
                required
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={deliveryDetails.address}
                onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                placeholder="House number, Street name, Area"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Landmark (Optional)</label>
                <Input
                  value={deliveryDetails.landmark}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, landmark: e.target.value })}
                  placeholder="E.g., Near school, hospital"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Village/City *</label>
                <Input
                  required
                  value={deliveryDetails.city}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, city: e.target.value })}
                  placeholder="Village or City"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">District *</label>
                <Input
                  required
                  value={deliveryDetails.district}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, district: e.target.value })}
                  placeholder="District name"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">State *</label>
                <Input
                  required
                  value={deliveryDetails.state}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, state: e.target.value })}
                  placeholder="State name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground">Delivery Notes (Optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={deliveryDetails.notes}
                onChange={(e) => setDeliveryDetails({ ...deliveryDetails, notes: e.target.value })}
                placeholder="Any special instructions for delivery"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" variant="hero" disabled={placing}>
                {placing ? "Confirming Order…" : "Confirm Order"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
