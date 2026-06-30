import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { ArrowLeft, CreditCard, Shield, MapPin, Plus, Check, ShoppingBag, Truck, Info } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { createCheckoutSession, verifyPayment } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

interface DeliveryAddress {
  id?: string;
  fullName: string;
  mobile: string;
  alternateMobile?: string;
  address: string;
  landmark?: string;
  city: string;
  state: string;
  district: string;
  pincode: string;
  notes?: string;
}

// Dynamically load Razorpay SDK
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

type CheckoutStep = "address" | "summary" | "payment" | "verifying" | "confirmation";

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, cartTotal, clearCart } = useCart();
  
  const [step, setStep] = useState<CheckoutStep>("address");
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  
  const [formAddress, setFormAddress] = useState<DeliveryAddress>({
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

  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [loading, setLoading] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const checkoutFn = useServerFn(createCheckoutSession);
  const verifyFn = useServerFn(verifyPayment);

  // Load saved addresses on mount
  useEffect(() => {
    const saved = localStorage.getItem("henhouse_saved_addresses");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedAddresses(parsed);
        if (parsed.length > 0) {
          setSelectedAddressId(parsed[0].id);
          setFormAddress(parsed[0]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">No items to checkout.</p>
          <Link to="/marketplace" className="text-primary hover:underline mt-4 inline-block font-semibold">
            Go to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const shipping = 60;
  const grandTotal = cartTotal + shipping;

  const handleAddressChange = (id: string) => {
    setSelectedAddressId(id);
    if (id === "new") {
      setFormAddress({
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
    } else {
      const selected = savedAddresses.find((a) => a.id === id);
      if (selected) {
        setFormAddress(selected);
      }
    }
  };

  const validateAddress = () => {
    const { fullName, mobile, address, city, state, district, pincode } = formAddress;
    if (!fullName || !mobile || !address || !city || !state || !district || !pincode) {
      toast.error("Please fill all required address fields.");
      return false;
    }
    if (mobile.length < 10) {
      toast.error("Please enter a valid mobile number.");
      return false;
    }
    return true;
  };

  const handleProceedToSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAddress()) {
      // Save address if new
      if (selectedAddressId === "new") {
        const newAddressWithId = {
          ...formAddress,
          id: Math.random().toString(36).substring(2, 9),
        };
        const newList = [...savedAddresses, newAddressWithId];
        setSavedAddresses(newList);
        localStorage.setItem("henhouse_saved_addresses", JSON.stringify(newList));
        setSelectedAddressId(newAddressWithId.id);
      }
      setStep("summary");
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setStep("verifying");

    try {
      const payload = {
        items: items.map((item) => ({
          product_type: item.product_type,
          listing_id: item.listing_id || item.feed_product_id,
          quantity: item.quantity,
        })),
        delivery: formAddress,
        notes,
        paymentMethod,
      };

      if (paymentMethod === "cod") {
        // Cash on Delivery
        const session = await checkoutFn({ data: payload });
        if (session.success) {
          setCreatedOrderId(session.order_id);
          toast.success("Order placed successfully (Cash on Delivery)!");
          clearCart();
          setStep("confirmation");
        } else {
          throw new Error("Failed to place order");
        }
      } else {
        // Online Payment (Razorpay)
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load Razorpay SDK. Check your internet connection.");
        }

        const session = await checkoutFn({ data: payload });

        const options = {
          key: session.key_id,
          amount: session.amount,
          currency: session.currency,
          name: "Poultry Connect Pro",
          description: "Marketplace Order Secure Payment",
          order_id: session.razorpay_order_id,
          prefill: {
            name: formAddress.fullName,
            contact: formAddress.mobile,
          },
          theme: {
            color: "#4f46e5",
          },
          handler: async function (response: any) {
            setLoading(true);
            try {
              const verifyRes = await verifyFn({
                data: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order_id: session.order_id,
                },
              });

              if (verifyRes.success) {
                setCreatedOrderId(session.order_id);
                toast.success("Online payment successful! Order placed.");
                clearCart();
                setStep("confirmation");
              } else {
                toast.error("Payment verification failed. Please check order history.");
                navigate({ to: "/orders" });
              }
            } catch (verifyErr: any) {
              toast.error(verifyErr?.message || "Failed to verify payment");
              navigate({ to: "/orders" });
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              toast.warning("Payment cancelled. You can retry from order history.");
              setLoading(false);
              navigate({ to: "/orders" });
            },
          },
        };

        const rzpay = new (window as any).Razorpay(options);
        rzpay.open();
      }
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong placing the order.");
      setStep("payment");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        
        {/* Step Wizard Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-lg mx-auto relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-border -translate-y-1/2 -z-10" />
            
            {[
              { id: "address", label: "Address" },
              { id: "summary", label: "Summary" },
              { id: "payment", label: "Payment" },
              { id: "confirmation", label: "Confirmation" }
            ].map((s, idx) => {
              const isActive = step === s.id;
              const isCompleted = 
                (step === "summary" && idx < 1) ||
                (step === "payment" && idx < 2) ||
                (step === "verifying" && idx < 3) ||
                (step === "confirmation" && idx < 4);
              
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5 bg-background px-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border ${
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary scale-110 shadow" 
                      : isCompleted
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-muted text-muted-foreground border-border"
                  }`}>
                    {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isActive ? "text-primary font-extrabold" : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Steps */}
        {step === "address" && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft max-w-2xl mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Delivery Address
            </h2>
            
            {savedAddresses.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 mb-6">
                {savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleAddressChange(addr.id!)}
                    className={`text-left p-4 rounded-2xl border transition-all relative ${
                      selectedAddressId === addr.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-secondary/40"
                    }`}
                  >
                    <span className="font-bold text-sm text-foreground block mb-1">{addr.fullName}</span>
                    <span className="text-xs text-muted-foreground block line-clamp-2">{addr.address}, {addr.city}</span>
                    <span className="text-xs font-semibold text-foreground block mt-2">{addr.mobile}</span>
                    {selectedAddressId === addr.id && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-primary font-bold" />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddressChange("new")}
                  className={`text-center p-4 rounded-2xl border border-dashed transition-all flex flex-col items-center justify-center gap-1 ${
                    selectedAddressId === "new"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:bg-secondary/40 text-muted-foreground"
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  <span className="font-semibold text-xs">Use a New Address</span>
                </button>
              </div>
            )}

            <form onSubmit={handleProceedToSummary} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Full Name *</label>
                  <Input
                    required
                    value={formAddress.fullName}
                    onChange={(e) => setFormAddress({ ...formAddress, fullName: e.target.value })}
                    placeholder="E.g., John Doe"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Mobile Number *</label>
                  <Input
                    required
                    value={formAddress.mobile}
                    onChange={(e) => setFormAddress({ ...formAddress, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Alternate Mobile (Optional)</label>
                  <Input
                    value={formAddress.alternateMobile}
                    onChange={(e) => setFormAddress({ ...formAddress, alternateMobile: e.target.value })}
                    placeholder="Alternate number"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">PIN Code *</label>
                  <Input
                    required
                    value={formAddress.pincode}
                    onChange={(e) => setFormAddress({ ...formAddress, pincode: e.target.value })}
                    placeholder="6-digit PIN code"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground">Full Address *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formAddress.address}
                  onChange={(e) => setFormAddress({ ...formAddress, address: e.target.value })}
                  placeholder="House/Plot/Apartment number, Street name, Colony"
                  disabled={selectedAddressId !== "new"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Landmark (Optional)</label>
                  <Input
                    value={formAddress.landmark}
                    onChange={(e) => setFormAddress({ ...formAddress, landmark: e.target.value })}
                    placeholder="E.g., Near water tank, school"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Village/City *</label>
                  <Input
                    required
                    value={formAddress.city}
                    onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })}
                    placeholder="Village or City"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">District *</label>
                  <Input
                    required
                    value={formAddress.district}
                    onChange={(e) => setFormAddress({ ...formAddress, district: e.target.value })}
                    placeholder="District"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">State *</label>
                  <Input
                    required
                    value={formAddress.state}
                    onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })}
                    placeholder="State"
                    disabled={selectedAddressId !== "new"}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button type="submit" variant="hero" size="lg" className="rounded-xl font-bold px-8">
                  Next: Order Summary
                </Button>
              </div>
            </form>
          </div>
        )}

        {step === "summary" && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft max-w-2xl mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" /> Order Summary
            </h2>
            
            {/* Products List */}
            <div className="space-y-4 mb-6">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-secondary/20 border border-border/40">
                  <div className="h-14 w-14 rounded-xl bg-secondary/50 border flex items-center justify-center text-2xl flex-shrink-0">
                    {item.details.image_urls?.[0] ? (
                      <img src={item.details.image_urls[0]} className="h-full w-full object-cover rounded-xl" />
                    ) : (
                      item.product_type === "feed" ? "🌾" : "🐓"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate text-sm">{item.details.title}</h4>
                    <span className="text-xs text-muted-foreground block">
                      Quantity: {item.quantity} {item.details.unit || "unit"} × {formatPrice(item.details.price)}
                    </span>
                  </div>
                  <div className="font-bold text-foreground text-right text-sm">
                    {formatPrice(item.details.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address display */}
            <div className="bg-secondary/10 border border-border p-4 rounded-2xl mb-6">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> Shipping Address
              </h4>
              <p className="font-bold text-sm text-foreground">{formAddress.fullName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{formAddress.address}, {formAddress.city}, {formAddress.state} - {formAddress.pincode}</p>
              <p className="text-xs font-semibold text-foreground mt-1.5">Phone: {formAddress.mobile}</p>
            </div>

            {/* Order notes input */}
            <div className="mb-6">
              <label className="text-xs font-bold text-muted-foreground block mb-2">Order Notes (Optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., Please deliver after 2 PM..."
              />
            </div>

            {/* Subtotal table */}
            <div className="space-y-2.5 py-4 border-t border-border">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Delivery & Shipping</span>
                <span>{formatPrice(shipping)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border/40">
                <span>Total Amount</span>
                <span className="text-primary">{formatPrice(grandTotal)}</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep("address")} className="rounded-xl">
                Back to Address
              </Button>
              <Button type="button" variant="hero" onClick={() => setStep("payment")} className="rounded-xl font-bold px-8">
                Next: Payment Method
              </Button>
            </div>
          </div>
        )}

        {step === "payment" && (
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft max-w-md mx-auto">
            <h2 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Select Payment Method
            </h2>

            <div className="space-y-3 mb-6">
              {/* Razorpay Option */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === "razorpay" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "razorpay"}
                  onChange={() => setPaymentMethod("razorpay")}
                  className="mt-1 h-4 w-4 text-primary"
                />
                <div>
                  <span className="font-bold text-sm text-foreground block">Online Payment (Razorpay)</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Pay securely using UPI, Card, Net Banking, or Wallet.</span>
                </div>
              </label>

              {/* COD Option */}
              <label className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40"
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="mt-1 h-4 w-4 text-primary"
                />
                <div>
                  <span className="font-bold text-sm text-foreground block">Cash on Delivery (COD)</span>
                  <span className="text-xs text-muted-foreground block mt-0.5">Pay in cash directly to the agent upon delivery.</span>
                </div>
              </label>
            </div>

            {/* Total recap */}
            <div className="flex justify-between items-baseline mb-6 p-4 bg-secondary/20 rounded-2xl border border-border/50">
              <span className="text-xs font-bold text-muted-foreground">Total to Pay:</span>
              <span className="font-display text-2xl font-extrabold text-primary">{formatPrice(grandTotal)}</span>
            </div>

            <div className="flex gap-3 justify-between">
              <Button type="button" variant="outline" onClick={() => setStep("summary")} className="rounded-xl flex-1">
                Back
              </Button>
              <Button type="button" variant="hero" onClick={handlePlaceOrder} className="rounded-xl font-bold flex-1">
                {paymentMethod === "cod" ? "Place COD Order" : "Pay Online"}
              </Button>
            </div>
          </div>
        )}

        {step === "verifying" && (
          <div className="bg-card border border-border rounded-3xl p-10 shadow-soft max-w-sm mx-auto text-center">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="font-display text-lg font-bold text-foreground">Processing Secure Checkout</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
              Please do not close, go back, or refresh this page. We are preparing your request...
            </p>
          </div>
        )}

        {step === "confirmation" && (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-soft max-w-md mx-auto text-center">
            <div className="h-16 w-16 bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 animate-bounce">
              🎉
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground">Order Placed!</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Thank you for your purchase. Your order has been registered and is being processed.
            </p>

            {createdOrderId && (
              <div className="my-5 p-3.5 bg-secondary/30 rounded-2xl border border-border/40 text-xs text-left">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Order ID:</span>
                  <span className="font-bold text-foreground">#{createdOrderId.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <span className="font-bold text-foreground uppercase">{paymentMethod}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold text-primary">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-6">
              <Button type="button" variant="hero" onClick={() => navigate({ to: "/orders" })} className="rounded-xl font-bold h-11">
                View My Orders
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate({ to: "/marketplace" })} className="rounded-xl h-11">
                Continue Shopping
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
