import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Package, Store, CreditCard, Receipt, FileText, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { listMyOrders, retryPayment, verifyPayment, getInvoice } from "@/lib/orders.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatDate, formatPrice } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

const STATUS_TONES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  placed: "bg-blue-100 text-blue-800 border-blue-200",
  confirmed: "bg-purple-100 text-purple-800 border-purple-200",
  fulfilled: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function OrdersPage() {
  useRequireRole(["buyer", "admin"]);
  const qc = useQueryClient();
  
  const listFn = useServerFn(listMyOrders);
  const retryFn = useServerFn(retryPayment);
  const verifyFn = useServerFn(verifyPayment);
  const invoiceFn = useServerFn(getInvoice);

  const q = useQuery({ queryKey: ["my-orders"], queryFn: () => listFn() });

  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  const invoiceQ = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => invoiceFn({ data: { id: invoiceId! } }),
    enabled: !!invoiceId,
  });

  const handleRetry = async (order: any) => {
    setRetryingId(order.id);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay SDK.");
        setRetryingId(null);
        return;
      }

      const session = await retryFn({ data: { order_id: order.id } });

      const options = {
        key: session.key_id,
        amount: session.amount,
        currency: session.currency,
        name: "Henhouse",
        description: "Retry Payment",
        order_id: session.razorpay_order_id,
        prefill: {
          name: order.delivery_full_name || "",
          contact: order.delivery_mobile || "",
        },
        theme: {
          color: "#4f46e5",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyFn({
              data: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: order.id,
              },
            });

            if (verifyRes.success) {
              toast.success("Payment verified! Order placed.");
              qc.invalidateQueries({ queryKey: ["my-orders"] });
            } else {
              toast.error("Payment verification failed.");
            }
          } catch (verifyErr: any) {
            toast.error(verifyErr?.message || "Verification failed");
          }
        },
        modal: {
          ondismiss: function () {
            toast.warning("Payment window closed.");
          },
        },
      };

      const rzpay = new (window as any).Razorpay(options);
      rzpay.open();
    } catch (err: any) {
      toast.error(err?.message || "Failed to retry payment");
    } finally {
      setRetryingId(null);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-10 print:p-0 print:m-0">
        
        <div className="flex flex-col gap-2 mb-8 print:hidden">
          <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">
            Order History
          </h1>
          <p className="text-muted-foreground">
            Track and manage your poultry and feed purchases.
          </p>
        </div>

        {q.isLoading ? (
          <div className="text-center py-20 text-muted-foreground print:hidden">
            <span className="animate-spin text-primary mr-2">⏳</span> Loading order history...
          </div>
        ) : (q.data ?? []).length === 0 ? (
          <div className="mt-16 rounded-3xl border border-dashed border-border bg-card p-16 text-center max-w-lg mx-auto shadow-soft print:hidden">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-display text-lg font-bold text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Start shopping to populate your order history!
            </p>
            <Button variant="hero" asChild>
              <Link to="/marketplace"><Store className="h-4 w-4 mr-2" /> Browse marketplace</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6 print:hidden">
            {(q.data ?? []).map((o: any) => (
              <div key={o.id} className="rounded-3xl border border-border bg-card p-6 shadow-soft hover:shadow-card transition duration-200">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
                  <div className="flex gap-6 flex-wrap">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Order ID</span>
                      <span className="font-mono text-sm text-foreground">#{o.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Placed On</span>
                      <span className="text-sm text-foreground">{formatDate(o.placed_at)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Total Cost</span>
                      <span className="font-display text-lg font-extrabold text-primary">{formatPrice(o.total)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase block">Payment Method</span>
                      <span className="text-xs text-foreground uppercase">{o.razorpay_payment_id ? "Razorpay" : "Pending"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${STATUS_TONES[o.status] || "bg-secondary text-secondary-foreground border-border"}`}>
                      {o.status}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div className="py-4 space-y-4">
                  {o.items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4 items-center">
                      <div className="h-12 w-12 rounded-xl border border-border bg-secondary/30 flex items-center justify-center flex-shrink-0 select-none text-2xl">
                        {item.product_type === "chicken" ? "🐓" : "🌾"}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-sm text-foreground block">
                          {item.product_type === "chicken"
                            ? item.listing_id?.title || "Chicken listing"
                            : item.feed_product_id?.name || "Premium Poultry Feed"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Qty: {item.quantity} {item.weight ? `(${item.weight}kg bag)` : item.listing_id?.unit ? `(${item.listing_id.unit}s)` : ""} • Price: {formatPrice(item.unit_buyer_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Actions row */}
                <div className="pt-4 border-t border-border/60 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    {o.status === "pending" && (
                      <span className="inline-flex items-center text-xs font-semibold text-amber-600 gap-1">
                        <Clock className="h-3.5 w-3.5" /> Payment is pending. Complete checkout now.
                      </span>
                    )}
                    {o.status === "placed" && (
                      <span className="inline-flex items-center text-xs font-semibold text-emerald-600 gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Paid & placed successfully.
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {o.status === "pending" && (
                      <Button
                        size="sm"
                        variant="hero"
                        onClick={() => handleRetry(o)}
                        disabled={retryingId === o.id}
                        className="rounded-xl font-bold"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {retryingId === o.id ? "Processing..." : "Retry Payment"}
                      </Button>
                    )}
                    {o.status !== "pending" && o.status !== "cancelled" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setInvoiceId(o.id)}
                        className="rounded-xl font-semibold"
                      >
                        <Receipt className="h-4 w-4 mr-2" /> View Invoice
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Print Invoice Dialog */}
        <Dialog open={!!invoiceId} onOpenChange={(open) => !open && setInvoiceId(null)}>
          <DialogContent className="max-w-2xl p-6 rounded-3xl print:p-0 print:border-none print:shadow-none">
            <DialogHeader className="print:hidden">
              <DialogTitle className="font-display font-bold">Order Invoice</DialogTitle>
              <DialogDescription>Review and print receipt for your records.</DialogDescription>
            </DialogHeader>

            {invoiceQ.isLoading ? (
              <div className="py-12 text-center text-muted-foreground">Generating invoice...</div>
            ) : invoiceQ.data ? (
              <div className="space-y-6 print:space-y-8">
                {/* Print layout invoice details */}
                <div className="flex justify-between items-start border-b border-border/80 pb-6 print:pb-8">
                  <div>
                    <h2 className="font-display text-2xl font-black text-primary">HENHOUSE</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Poultry Connect Pro Marketplace</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-muted-foreground uppercase block">Invoice</span>
                    <span className="font-mono text-sm font-bold text-foreground">#{invoiceQ.data.order._id.slice(-8).toUpperCase()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Billed To</h3>
                    <p className="font-semibold text-foreground">{invoiceQ.data.order.buyer_id?.full_name}</p>
                    <p className="text-muted-foreground text-xs">{invoiceQ.data.order.buyer_id?.email}</p>
                    <p className="text-muted-foreground text-xs">{invoiceQ.data.order.buyer_id?.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Delivery Details</h3>
                    <p className="font-semibold text-foreground">{invoiceQ.data.order.delivery_full_name}</p>
                    <p className="text-muted-foreground text-xs">{invoiceQ.data.order.delivery_address}</p>
                    <p className="text-muted-foreground text-xs">{invoiceQ.data.order.delivery_city}, {invoiceQ.data.order.delivery_state} - {invoiceQ.data.order.delivery_pincode}</p>
                    <p className="text-muted-foreground text-xs font-semibold mt-1">Mobile: {invoiceQ.data.order.delivery_mobile}</p>
                  </div>
                </div>

                {/* Items Invoice Table */}
                <div className="border border-border/80 rounded-2xl overflow-hidden bg-secondary/10 overflow-x-auto w-full">
                  <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                    <thead>
                      <tr className="bg-secondary/40 border-b border-border/80">
                        <th className="p-3 font-bold text-muted-foreground">Item Description</th>
                        <th className="p-3 font-bold text-muted-foreground text-center">Qty</th>
                        <th className="p-3 font-bold text-muted-foreground text-right">Unit Price</th>
                        <th className="p-3 font-bold text-muted-foreground text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {invoiceQ.data.items?.map((item: any, idx: number) => {
                        const title = item.product_type === "chicken"
                          ? item.listing_id?.title || "Chicken listing"
                          : `${item.feed_product_id?.name || "Premium Feed"} (${item.weight}kg)`;
                        return (
                          <tr key={idx}>
                            <td className="p-3 font-semibold text-foreground capitalize">{title}</td>
                            <td className="p-3 text-center text-foreground font-medium">{item.quantity}</td>
                            <td className="p-3 text-right text-foreground font-medium">{formatPrice(item.unit_buyer_price)}</td>
                            <td className="p-3 text-right text-foreground font-bold">{formatPrice(item.unit_buyer_price * item.quantity)}</td>
                          </tr>
                        );
                      })}
                      {/* Shipping */}
                      <tr>
                        <td colSpan={3} className="p-3 font-semibold text-muted-foreground text-right">Standard Delivery Fee:</td>
                        <td className="p-3 text-right text-foreground font-bold">{formatPrice(60)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-baseline pt-4 border-t border-border/80">
                  <div>
                    <span className="text-xs text-muted-foreground font-medium uppercase block">Status</span>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Paid - Razorpay</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground font-medium uppercase block">Total Billed</span>
                    <span className="font-display text-2xl font-black text-primary">{formatPrice(invoiceQ.data.order.total)}</span>
                  </div>
                </div>

                {/* Print button footer */}
                <div className="flex justify-end gap-2 pt-4 border-t border-border/60 print:hidden">
                  <Button variant="outline" onClick={() => setInvoiceId(null)} className="rounded-xl">
                    Close
                  </Button>
                  <Button variant="hero" onClick={printInvoice} className="rounded-xl font-bold">
                    <FileText className="h-4 w-4 mr-2" /> Print Invoice
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
