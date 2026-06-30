import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Trash2, ArrowLeft, ShoppingBag, Plus, Minus, Sprout } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";

export const Route = createFileRoute("/_authenticated/cart")({
  component: CartPage,
});

function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();

  const shipping = items.length > 0 ? 60 : 0;
  const grandTotal = cartTotal + shipping;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        
        {/* Header */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="font-display text-4xl font-extrabold text-foreground tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-muted-foreground">
            Manage your chicken listings and feed orders in one place.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-border bg-card p-16 text-center max-w-2xl mx-auto shadow-soft">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/50 text-4xl mb-4 select-none">
              🛒
            </div>
            <p className="font-display text-xl font-bold text-foreground">Your cart is empty</p>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto mb-6">
              Looks like you haven't added anything to your cart yet. Check out the poultry or feeds marketplace.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="hero" asChild>
                <Link to="/marketplace">Browse Marketplace</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Items List */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, idx) => {
                const itemId = (item.listing_id || item.feed_product_id)!;
                const itemKey = `${itemId}-${item.weight || 0}`;

                return (
                  <div
                    key={itemKey}
                    className="flex flex-col sm:flex-row items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft transition-all"
                  >
                    {/* Item Image */}
                    <div className="h-20 w-20 overflow-hidden rounded-2xl bg-secondary/40 border border-border flex items-center justify-center flex-shrink-0">
                      {item.details.image_urls?.[0] ? (
                        <img
                          src={item.details.image_urls[0]}
                          alt={item.details.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl select-none">
                          {item.product_type === "chicken" ? "🐓" : "🌾"}
                        </span>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${
                          item.product_type === "chicken"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {item.product_type}
                        </span>
                        {item.weight && (
                          <span className="text-[10px] font-bold bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                            {item.weight} kg bag
                          </span>
                        )}
                      </div>
                      <h3 className="font-display font-bold text-foreground line-clamp-1">
                        {item.details.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        Unit Price: {formatPrice(item.details.price)}
                      </span>
                    </div>

                    {/* Quantity Adjustment */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => updateQuantity(itemId, item.quantity - 1, item.weight)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-bold text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => updateQuantity(itemId, item.quantity + 1, item.weight)}
                        disabled={item.quantity >= item.details.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Total Price & Delete */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/40">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Total</span>
                        <span className="font-display font-extrabold text-foreground">
                          {formatPrice(item.details.price * item.quantity)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl"
                        onClick={() => removeFromCart(itemId, item.weight)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mt-4"
              >
                <ArrowLeft className="h-4 w-4" /> Continue shopping
              </Link>
            </div>

            {/* Order Summary Card */}
            <div className="lg:col-span-1">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sticky top-24">
                <h2 className="font-display text-lg font-bold text-foreground mb-4">Order Summary</h2>

                <div className="space-y-3 py-4 border-y border-border/60 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Shipping</span>
                    <span className="font-semibold text-foreground">{formatPrice(shipping)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline mb-6">
                  <span className="text-sm font-bold text-foreground">Grand Total</span>
                  <span className="font-display text-2xl font-extrabold text-primary">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full rounded-xl font-bold h-12"
                  onClick={() => navigate({ to: "/checkout" })}
                >
                  <ShoppingBag className="h-4 w-4 mr-2" /> Proceed to Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
