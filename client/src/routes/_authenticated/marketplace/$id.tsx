import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, MapPin, Package, ShoppingCart, 
  ChevronLeft, ChevronRight, Maximize2, X, ZoomIn, ZoomOut 
} from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getListingForBuyer } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { getMe } from "@/lib/me.functions";

export const Route = createFileRoute("/_authenticated/marketplace/$id")({
  component: ListingDetail,
});

function ListingDetail() {
  useRequireRole(["buyer", "admin", "farmer"]);
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getListingForBuyer);
  const q = useQuery({ queryKey: ["listing", id], queryFn: () => getFn({ data: { id } }) });
  
  const { addToCart, items } = useCart();
  const meFn = useServerFn(getMe);
  const meQ = useQuery({ queryKey: ["me"], queryFn: () => meFn(), retry: false });
  const isAdmin = meQ.data?.roles?.includes("admin") ?? false;
  
  const isItemInCart = items.some(item => item.listing_id === id || item.feed_product_id === id);
  const [qty, setQty] = useState(1);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  
  // Lightbox / Fullscreen Preview State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxZoom, setLightboxZoom] = useState(1);

  if (q.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em]" />
          <p className="mt-4 text-muted-foreground font-medium">Loading premium listing...</p>
        </div>
      </div>
    );
  }

  if (!q.data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
            <X className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Listing Not Found</h2>
          <p className="mt-2 text-muted-foreground">This item may have been sold out or archived.</p>
          <Button asChild className="mt-6 rounded-xl" variant="outline">
            <Link to="/marketplace">Browse Marketplace</Link>
          </Button>
        </div>
      </div>
    );
  }

  const l = q.data;
  const imageList = l.image_urls && l.image_urls.length > 0 ? l.image_urls : [];
  const total = Number(l.buyer_price) * qty;

  const handleAddToCart = (quiet = false) => {
    addToCart({
      product_type: l.category === "feed" ? "feed" : "chicken",
      listing_id: l.id,
      quantity: qty,
      details: {
        title: l.title,
        image_urls: imageList,
        price: l.buyer_price,
        unit: l.unit || "unit",
        stock: l.quantity,
      }
    });
    if (!quiet) {
      toast.success(`${l.title} added to cart!`);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart(true);
    navigate({ to: "/checkout" });
  };

  const isSellerAdmin = l.farmer_id?.roles?.includes("admin");

  // Navigation handlers
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev - 1 + imageList.length) % imageList.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev + 1) % imageList.length);
  };

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxZoom(1);
    setIsLightboxOpen(true);
  };

  const handlePrevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + imageList.length) % imageList.length);
    setLightboxZoom(1);
  };

  const handleNextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % imageList.length);
    setLightboxZoom(1);
  };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-10">
      <AppHeader />
      <main className="container mx-auto px-4 py-8">
        {/* Navigation Breadcrumb */}
        <Link 
          to="/marketplace" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group mb-6"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to marketplace
        </Link>

        {/* Content Section */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Column 1: Image Gallery (6/12) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Large Active Image Box */}
            <div className="aspect-[4/3] relative rounded-3xl overflow-hidden border border-border/80 bg-secondary/20 shadow-soft group flex items-center justify-center">
              {imageList[activeImgIdx] ? (
                <div 
                  className="w-full h-full relative cursor-zoom-in overflow-hidden"
                  onClick={() => openLightbox(activeImgIdx)}
                >
                  <img 
                    src={imageList[activeImgIdx]} 
                    alt={l.title} 
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="p-3 rounded-full bg-background/85 shadow text-foreground/80 hover:text-foreground hover:scale-105 transition-all">
                      <Maximize2 className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-8xl select-none">{l.category === "feed" ? "🌾" : "🐓"}</span>
              )}

              {/* Prev / Next controls inside Main Box */}
              {imageList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 text-foreground border border-border shadow flex items-center justify-center hover:bg-background hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/90 text-foreground border border-border shadow flex items-center justify-center hover:bg-background hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Seller Type Pill */}
              <div className="absolute top-4 left-4">
                <span className={`rounded-xl px-3 py-1.5 text-xs font-bold tracking-wide uppercase shadow-sm border ${
                  isSellerAdmin 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-background text-foreground border-border"
                }`}>
                  {isSellerAdmin ? "Admin Seller" : "Farmer Seller"}
                </span>
              </div>
            </div>

            {/* Clickable Image Thumbnails */}
            {imageList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto py-1 scrollbar-thin">
                {imageList.map((url: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImgIdx(i)}
                    type="button"
                    className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                      activeImgIdx === i 
                        ? "border-primary shadow-soft scale-105" 
                        : "border-border/60 opacity-70 hover:opacity-100 hover:scale-102"
                    }`}
                  >
                    <img src={url} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: Details & Pricing Widget (6/12) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-3.5 py-1 text-xs capitalize font-bold">
                  {l.category}
                </span>
                {l.category === "feed" && l.feed_category && (
                  <span className="rounded-full bg-accent/15 text-accent border border-accent/20 px-3.5 py-1 text-xs capitalize font-bold">
                    {l.feed_category}
                  </span>
                )}
                {l.farmer_id && (
                  <span className="text-xs text-muted-foreground font-medium">
                    Listed by: <span className="text-foreground font-bold">{l.farmer_id.farm_name || l.farmer_id.full_name || "Admin"}</span>
                  </span>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl md:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
                {l.title}
              </h1>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {l.category === "feed" && l.feed_category && (
                <div className="rounded-2xl border border-border/60 bg-secondary/10 p-3 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Feed Category</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{l.feed_category}</div>
                </div>
              )}
              {l.breed && (
                <div className="rounded-2xl border border-border/60 bg-secondary/10 p-3 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Breed</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{l.breed}</div>
                </div>
              )}
              {l.brand && (
                <div className="rounded-2xl border border-border/60 bg-secondary/10 p-3 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Brand</div>
                  <div className="mt-1 text-sm font-semibold text-foreground">{l.brand}</div>
                </div>
              )}
              {l.location && (
                <div className="rounded-2xl border border-border/60 bg-secondary/10 p-3 text-center col-span-2 sm:col-span-1">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Location</div>
                  <div className="mt-1 text-sm font-semibold text-foreground truncate inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary flex-shrink-0" /> {l.location}
                  </div>
                </div>
              )}
            </div>

            {/* Specifications if feed */}
            {l.specifications && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <span className="text-xs uppercase font-extrabold tracking-wider text-primary">Feed Specifications</span>
                <p className="mt-2 text-sm text-foreground/90 font-medium">{l.specifications}</p>
              </div>
            )}

            {/* Description */}
            {l.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Product Description</h3>
                <p className="whitespace-pre-line text-sm text-foreground/80 leading-relaxed bg-secondary/10 p-4 rounded-2xl border border-border/40">
                  {l.description}
                </p>
              </div>
            )}

            {/* Quantity Stock Indicators */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 px-4 py-2.5 rounded-xl border border-border/50 w-fit">
              <Package className="h-4 w-4 text-primary" />
              <span>Stock Status: <span className="font-bold text-foreground">{l.quantity} {l.unit}s available</span></span>
            </div>

            {/* Sticky Actions Widget */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
              <div className="flex items-baseline justify-between border-b border-border/80 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price per {l.unit || "unit"}</span>
                  <div className="font-display text-3xl font-extrabold text-primary mt-1">{formatPrice(l.buyer_price)}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Cost</span>
                  <div className="font-display text-2xl font-black text-foreground mt-1">{formatPrice(total)}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-bold text-foreground">Select Quantity</span>
                <div className="flex items-center gap-2 border border-border rounded-xl p-1 bg-secondary/20">
                  <button 
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-foreground hover:bg-card transition"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={l.quantity}
                    value={qty}
                    onChange={(e) => setQty(Math.max(1, Math.min(l.quantity, Number(e.target.value))))}
                    className="h-8 w-16 border-0 bg-transparent text-center font-bold p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <button 
                    type="button"
                    onClick={() => setQty(Math.min(l.quantity, qty + 1))}
                    className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-foreground hover:bg-card transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Actions Grid */}
              {!isAdmin && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {isItemInCart ? (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="rounded-2xl font-bold h-12 border-primary text-primary hover:bg-primary/5 shadow-sm" 
                      onClick={() => navigate({ to: "/cart" })}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> Go to Cart
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="rounded-2xl font-bold h-12 border-border/85 hover:bg-secondary/40 shadow-sm" 
                      onClick={() => handleAddToCart(false)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                    </Button>
                  )}
                  <Button 
                    variant="hero" 
                    size="lg" 
                    className="rounded-2xl font-bold h-12 shadow-soft hover:scale-102 transition-transform" 
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      {/* Floating Sticky Actions Bar (Mobile Only) */}
      {!isAdmin && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur px-4 py-3 shadow-lg z-40 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Total Cost</div>
            <div className="font-display text-lg font-black text-foreground">{formatPrice(total)}</div>
          </div>
          <div className="flex gap-2 flex-1 max-w-xs justify-end">
            {isItemInCart ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold h-10 px-3 flex-shrink-0 border-primary text-primary hover:bg-primary/5"
                onClick={() => navigate({ to: "/cart" })}
              >
                <ShoppingCart className="h-4 w-4 mr-1" /> Go to Cart
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold h-10 px-3 flex-shrink-0"
                onClick={() => handleAddToCart(false)}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="hero" 
              size="sm" 
              className="rounded-xl font-bold h-10 flex-1"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && imageList[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 transition-all duration-300">
          
          {/* Top Panel Controls */}
          <div className="flex items-center justify-between text-white/80 p-2">
            <span className="text-sm font-semibold tracking-wider">
              {lightboxIndex + 1} / {imageList.length}
            </span>
            <div className="flex items-center gap-3">
              <button 
                type="button"
                onClick={() => setLightboxZoom(prev => Math.max(1, prev - 0.5))}
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button 
                type="button"
                onClick={() => setLightboxZoom(prev => Math.min(3, prev + 0.5))}
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button 
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Large Lightbox Image Viewport */}
          <div className="flex-1 flex items-center justify-center relative overflow-hidden">
            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handlePrevLightbox}
                className="absolute left-4 z-10 h-12 w-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div 
              className="max-h-[80vh] max-w-[90vw] transition-transform duration-200 ease-out"
              style={{ transform: `scale(${lightboxZoom})` }}
            >
              <img 
                src={imageList[lightboxIndex]} 
                alt="Fullscreen Preview" 
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg" 
              />
            </div>

            {imageList.length > 1 && (
              <button
                type="button"
                onClick={handleNextLightbox}
                className="absolute right-4 z-10 h-12 w-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip inside Lightbox */}
          {imageList.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto py-2">
              {imageList.map((url: string, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxZoom(1);
                  }}
                  type="button"
                  className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    lightboxIndex === i ? "border-primary scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} alt={`Lightbox thumb ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
