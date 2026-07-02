import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, ArrowRight, ShoppingCart } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listMarketplace } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/farmer/chicks-purchase")({
  component: ChicksPurchasePage,
});

function ChicksPurchasePage() {
  useRequireRole(["farmer"]);
  const navigate = useNavigate();
  const { addToCart, items } = useCart();
  const [search, setSearch] = useState("");
  const fn = useServerFn(listMarketplace);
  const q = useQuery({
    queryKey: ["chicks-purchase", search],
    queryFn: () => fn({ data: { search } }),
  });

  const rawListings = q.data ?? [];
  
  // Filter out any feed listings (only show chick/chicken/egg/other listings)
  const chicksListings = rawListings.filter((l: any) => l.category !== "feed");

  // Filter listings marked as featured banners
  const featuredBanners = chicksListings.filter(
    (l: any) => l.is_featured_banner === true && l.status === "live"
  );

  const [activeBannerIdx, setActiveBannerIdx] = useState(0);

  // Auto scroll banners
  useEffect(() => {
    if (featuredBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % featuredBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredBanners.length]);

  const handlePrevBanner = () => {
    setActiveBannerIdx((prev) => (prev - 1 + featuredBanners.length) % featuredBanners.length);
  };

  const handleNextBanner = () => {
    setActiveBannerIdx((prev) => (prev + 1) % featuredBanners.length);
  };

  const isItemInCart = (productId: string) => {
    return items.some(item => item.listing_id === productId || item.feed_product_id === productId);
  };

  const handleAddToCart = (e: React.MouseEvent, l: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      product_type: l.category === "feed" ? "feed" : "chicken",
      listing_id: l.id,
      quantity: 1,
      details: {
        title: l.title,
        image_urls: l.image_urls || [],
        price: l.buyer_price,
        unit: l.unit || "unit",
        stock: l.quantity,
      }
    });
    toast.success(`${l.title} added to cart!`);
  };

  const handleBuyNow = (e: React.MouseEvent, l: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear cart and add the selected item to pre-fill
    localStorage.setItem("henhouse_cart", JSON.stringify([{
      product_type: l.category === "feed" ? "feed" : "chicken",
      listing_id: l.id,
      quantity: 1,
      details: {
        title: l.title,
        image_urls: l.image_urls || [],
        price: l.buyer_price,
        unit: l.unit || "unit",
        stock: l.quantity,
      }
    }]));
    
    navigate({ to: "/checkout" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold text-primary">Chicks Purchase</h1>
            <p className="mt-1 text-muted-foreground">Vetted poultry listings, transparent pricing.</p>
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
          </div>
        </div>

        {/* Featured Banners Slider */}
        {!q.isLoading && featuredBanners.length > 0 && (
          <div className="mt-8 relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-soft group/banner">
            <div 
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${activeBannerIdx * 100}%)` }}
            >
              {featuredBanners.map((b: any) => (
                <div key={b.id} className="w-full flex-shrink-0 grid md:grid-cols-2 gap-6 p-4 sm:p-8 md:p-12 items-center">
                  <div className="space-y-4">
                    <span className="inline-block bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Featured Chicken
                    </span>
                    <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                      {b.title}
                    </h2>
                    {b.brand && (
                      <p className="text-sm font-semibold text-muted-foreground">
                        Brand: {b.brand}
                      </p>
                    )}
                    <p className="text-sm text-foreground/80 line-clamp-3 leading-relaxed max-w-md">
                      {b.description || "Fresh stock listed on the marketplace. Vetted and ready to purchase with secure payment options."}
                    </p>
                    <div className="pt-2 flex items-baseline gap-3">
                      <span className="font-display text-3xl font-extrabold text-primary">
                        {formatPrice(b.buyer_price)}
                      </span>
                      <span className="text-xs text-muted-foreground">per {b.unit}</span>
                    </div>
                    <div className="pt-4 flex gap-3">
                      {isItemInCart(b.id) ? (
                        <Button 
                          type="button"
                          variant="outline"
                          className="rounded-xl font-bold h-11 border-primary text-primary hover:bg-primary/5"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate({ to: "/cart" });
                          }}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" /> Go to Cart
                        </Button>
                      ) : (
                        <Button 
                          type="button"
                          variant="outline"
                          className="rounded-xl font-bold h-11 border-border/80 text-foreground hover:bg-secondary/40"
                          onClick={(e) => handleAddToCart(e, b)}
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                        </Button>
                      )}
                      <Button 
                        type="button" 
                        variant="hero" 
                        className="rounded-xl font-bold h-11"
                        onClick={(e) => handleBuyNow(e, b)}
                      >
                        Buy Now <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="h-48 sm:h-64 md:h-80 w-full overflow-hidden rounded-2xl border border-border/80 bg-secondary/30 relative flex items-center justify-center">
                    {b.image_urls?.[0] ? (
                      <img src={b.image_urls[0]} alt={b.title} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-8xl select-none">🐓</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Controls */}
            {featuredBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevBanner}
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border bg-card/85 text-foreground flex items-center justify-center shadow hover:bg-card transition opacity-100 sm:opacity-0 sm:group-hover/banner:opacity-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextBanner}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full border border-border bg-card/85 text-foreground flex items-center justify-center shadow hover:bg-card transition opacity-100 sm:opacity-0 sm:group-hover/banner:opacity-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {featuredBanners.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveBannerIdx(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        activeBannerIdx === idx ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Listings Grid */}
        {q.isLoading ? (
          <div className="mt-12 text-center text-muted-foreground">Loading listings…</div>
        ) : chicksListings.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="font-display text-xl text-foreground">No listings found</p>
            <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {chicksListings.map((l: any) => {
              return (
                <Link
                  key={l.id}
                  to="/marketplace/$id"
                  params={{ id: l.id }}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition hover:-translate-y-0.5 hover:shadow-card flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
                      {l.image_urls?.[0] ? (
                        <img src={l.image_urls[0]} alt={l.title} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full place-items-center font-display text-3xl text-primary/30">
                          🐓
                        </div>
                      )}
                    </div>
                    <div className="p-5 pb-0">
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
                  </div>
                  <div className="p-5 pt-3 grid grid-cols-2 gap-2">
                    {isItemInCart(l.id) ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="font-bold rounded-xl py-4 flex items-center justify-center gap-1.5 h-10 border-primary text-primary hover:bg-primary/5 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate({ to: "/cart" });
                        }}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Go to Cart
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        className="font-bold rounded-xl py-4 flex items-center justify-center gap-1.5 h-10 border-border/80 text-foreground hover:bg-secondary/40 text-xs"
                        onClick={(e) => handleAddToCart(e, l)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="hero"
                      className="font-bold rounded-xl py-4 flex items-center justify-center gap-1.5 h-10"
                      onClick={(e) => handleBuyNow(e, l)}
                    >
                      Buy Now
                    </Button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
