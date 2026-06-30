import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Upload, X, Tags, Wheat } from "lucide-react";
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
import { getListingForEdit, updateListing, archiveListing } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/farmer/listings/$id/edit")({
  component: EditListing,
});

function EditListing() {
  useRequireRole(["farmer", "admin"]);
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getEditFn = useServerFn(getListingForEdit);
  const updateFn = useServerFn(updateListing);
  const archiveFn = useServerFn(archiveListing);
  
  const meQ = useQuery({ queryKey: ["me"] });
  const isAdmin = (meQ.data as any)?.roles?.includes("admin");
  const dashboardLink = isAdmin ? "/admin/listings" : "/farmer";

  const q = useQuery({ queryKey: ["listing-edit", id], queryFn: () => getEditFn({ data: { id } }) });
  const listing = q.data;

  const [form, setForm] = useState<any>(null);
  const [images, setImages] = useState<{ public_id: string; secure_url: string; }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [productType, setProductType] = useState<"chicken" | "feed">("chicken");

  useEffect(() => {
    if (listing && !form) {
      const type = listing.category === "feed" ? "feed" : "chicken";
      setProductType(type);
      setForm({
        title: listing.title,
        category: listing.category || "broiler",
        breed: listing.breed ?? "",
        quantity: listing.quantity,
        unit: listing.unit,
        farmer_price: listing.farmer_price,
        location: listing.location ?? "",
        description: listing.description ?? "",
        brand: listing.brand ?? "",
        is_featured_banner: listing.is_featured_banner ?? false,
        specifications: listing.specifications ?? "",
      });
      setImages(listing.images ?? []);
    }
  }, [listing, form]);

  if (q.isLoading || !form) return <div><AppHeader /><div className="container mx-auto p-12 text-muted-foreground">Loading…</div></div>;
  if (!listing) return <div><AppHeader /><div className="container mx-auto p-12">Listing not found.</div></div>;

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }
    // Validate type
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateFn({
        data: {
          id,
          title: form.title,
          category: productType === "feed" ? "feed" : form.category,
          breed: productType === "feed" ? null : (form.breed || null),
          quantity: Number(form.quantity),
          unit: form.unit,
          farmer_price: Number(form.farmer_price),
          location: form.location || null,
          description: form.description || null,
          images: images,
          brand: productType === "feed" ? form.brand : null,
          is_featured_banner: isAdmin ? form.is_featured_banner : false,
          specifications: productType === "feed" ? form.specifications : null,
        },
      });
      toast.success("Listing updated");
      navigate({ to: dashboardLink });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    }
  }

  async function archive() {
    if (!confirm("Archive this listing? It will no longer be visible to buyers.")) return;
    try {
      await archiveFn({ data: { id } });
      toast.success("Archived");
      navigate({ to: dashboardLink });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not archive");
    }
  }

  const handleProductTypeChange = (type: "chicken" | "feed") => {
    setProductType(type);
    setForm((prev: any) => ({
      ...prev,
      unit: type === "feed" ? "Bag" : "Bird",
      category: type === "feed" ? "feed" : "broiler",
    }));
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Link to={dashboardLink} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">Edit listing</h1>
        
        {/* Product Type Selector */}
        <div className="mt-6 grid grid-cols-2 gap-3 p-1.5 bg-secondary/30 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => handleProductTypeChange("chicken")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              productType === "chicken"
                ? "bg-card text-foreground shadow border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tags className="h-4 w-4 text-primary" /> Chicken Listing
          </button>
          <button
            type="button"
            onClick={() => handleProductTypeChange("feed")}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              productType === "feed"
                ? "bg-card text-foreground shadow border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wheat className="h-4 w-4 text-primary" /> Feed Listing
          </button>
        </div>

        <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          {/* Dynamic Fields */}
          {productType === "chicken" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["broiler", "layer", "chick", "egg", "other"].map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="breed">Breed (optional)</Label>
                <Input id="breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="brand">Brand *</Label>
                <Input id="brand" required={productType === "feed"} value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="specifications">Specifications (optional)</Label>
                <Input id="specifications" value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="quantity">Quantity (Stock) *</Label>
              <Input id="quantity" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Unit *</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {productType === "chicken" ? (
                    ["Bird", "Crate", "Kg", "Other"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))
                  ) : (
                    ["Bag", "Kg", "Gram", "Tonne"].map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Your Price (per unit) *</Label>
              <Input id="price" type="number" min={0} step="0.01" value={form.farmer_price} onChange={(e) => setForm({ ...form, farmer_price: Number(e.target.value) })} />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location *</Label>
            <Input id="location" required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Featured Banner Switch - Admin Only */}
          {isAdmin && (
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
          )}

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

          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={archive} className="text-destructive">Archive listing</Button>
            <Button type="submit" variant="hero">Save changes</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
