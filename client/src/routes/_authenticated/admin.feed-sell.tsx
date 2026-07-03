import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createListing } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/admin/feed-sell")({
  component: AdminFeedSell,
});

function AdminFeedSell() {
  useRequireRole(["admin"]);
  const navigate = useNavigate();
  const fn = useServerFn(createListing);
  
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<{ public_id: string; secure_url: string; }[]>([]);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    brand: "",
    specifications: "",
    quantity: 10,
    unit: "Bag",
    farmer_price: "" as any,
    location: "",
    description: "",
    feed_category: "",
    is_featured_banner: false,
    target_audience: "both" as "buyer" | "farmer" | "both",
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, JPEG, PNG, and WEBP images are supported");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await api.post("/api/listings/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImages([...images, { public_id: res.data.public_id, secure_url: res.data.secure_url }]);
      toast.success("Image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(form.farmer_price) <= 0 || Number.isNaN(Number(form.farmer_price))) {
      toast.error("Please enter a valid positive price.");
      return;
    }
    if (!form.brand) {
      toast.error("Brand is required.");
      return;
    }
    if (!form.feed_category) {
      toast.error("Feed Category is required.");
      return;
    }
    setSubmitting(true);
    try {
      await fn({
        data: {
          title: form.title,
          category: "feed",
          breed: null,
          quantity: Number(form.quantity),
          unit: form.unit,
          farmer_price: Number(form.farmer_price),
          buyer_price: Number(form.farmer_price),
          location: form.location || null,
          description: form.description || null,
          images: images,
          status: "live",
          brand: form.brand,
          feed_category: form.feed_category,
          is_featured_banner: form.is_featured_banner,
          specifications: form.specifications || null,
          target_audience: form.target_audience,
        },
      });
      toast.success("Feed listing published live!");
      navigate({ to: "/admin/manage-listings" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Link to="/admin/manage-listings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Manage Listings
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">New Feed Listing</h1>
        <p className="mt-1 text-muted-foreground">
          Directly create a new feed listing and publish it to the marketplace.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              required 
              value={form.title} 
              onChange={(e) => setForm({ ...form, title: e.target.value })} 
              placeholder="Premium poultry grower feed" 
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input id="brand" required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="E.g., Suguna Feed" />
            </div>
            <div>
              <Label>Feed Category *</Label>
              <Select
                value={form.feed_category}
                onValueChange={(v) => setForm({ ...form, feed_category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {["Pre Starter", "Starter", "Final"].map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="specifications">Specifications (optional)</Label>
              <Input id="specifications" value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} placeholder="Protein: 21%, Fiber: 5%" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="quantity">Quantity (Stock) *</Label>
              <Input id="quantity" type="number" min={0} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Unit *</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {["Bag", "Kg", "Gram", "Tonne"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Asking Price (per unit) *</Label>
              <Input id="price" type="number" min="0.01" step="0.01" required value={form.farmer_price} onChange={(e) => setForm({ ...form, farmer_price: e.target.value })} placeholder="Enter price" />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input id="location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Village, City, or District" />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Key ingredients, feeding guidelines..." />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-secondary/10">
              <div>
                <Label htmlFor="is_featured_banner" className="font-bold text-foreground">Featured Banner</Label>
                <p className="text-xs text-muted-foreground">Show this listing in the marketplace hero promotion slides</p>
              </div>
              <Switch
                id="is_featured_banner"
                checked={form.is_featured_banner}
                onCheckedChange={(checked) => setForm({ ...form, is_featured_banner: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience" className="font-bold text-foreground">Target Audience</Label>
              <Select
                value={form.target_audience}
                onValueChange={(v) => setForm({ ...form, target_audience: v as any })}
              >
                <SelectTrigger id="target_audience" className="rounded-xl">
                  <SelectValue placeholder="Select target audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer Only</SelectItem>
                  <SelectItem value="farmer">Farmer Only</SelectItem>
                  <SelectItem value="both">Buyer & Farmer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Determine who can see this product listing in the marketplace.</p>
            </div>
          </div>

          <div>
            <Label>Listing Images</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                  <img src={img.secure_url} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border hover:bg-secondary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="mt-1 text-[10px] text-muted-foreground font-medium">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
            {uploading && <p className="mt-1 text-xs text-muted-foreground">Uploading image...</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" asChild><Link to="/admin/manage-listings">Cancel</Link></Button>
            <Button type="submit" variant="hero" disabled={submitting}>{submitting ? "Submitting…" : "Publish Listing"}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
