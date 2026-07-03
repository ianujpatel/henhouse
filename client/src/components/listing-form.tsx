import { useState, useEffect } from "react";
import { Upload, X, Tags, Wheat } from "lucide-react";
import { toast } from "sonner";
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
import { api } from "@/lib/api-client";
import { ListingImage } from "@/types";

interface ListingFormData {
  title: string;
  category: "broiler" | "layer" | "chick" | "egg" | "feed" | "other";
  breed: string;
  quantity: number;
  unit: string;
  farmer_price: any;
  location: string;
  description: string;
  brand: string;
  feed_category: string;
  is_featured_banner: boolean;
  specifications: string;
  target_audience: "buyer" | "farmer" | "both";
}

interface ListingFormProps {
  initialData?: Partial<ListingFormData> & { images?: ListingImage[] };
  onSubmit: (data: any, images: ListingImage[]) => Promise<void>;
  onCancel: () => void;
  onArchive?: () => Promise<void>;
  isAdmin: boolean;
  isEdit?: boolean;
  submitButtonText?: string;
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  showProductTypeSelector?: boolean;
}

export function ListingForm({
  initialData,
  onSubmit,
  onCancel,
  onArchive,
  isAdmin,
  isEdit = false,
  submitButtonText = "Submit Listing",
  titlePlaceholder,
  descriptionPlaceholder,
  showProductTypeSelector = true,
}: ListingFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<ListingImage[]>(initialData?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [productType, setProductType] = useState<"chicken" | "feed">(
    initialData?.category === "feed" ? "feed" : "chicken"
  );

  const [form, setForm] = useState<ListingFormData>({
    title: initialData?.title ?? "",
    category: initialData?.category ?? ("broiler" as any),
    breed: initialData?.breed ?? "",
    quantity: initialData?.quantity ?? 10,
    unit: initialData?.unit ?? (initialData?.category === "feed" ? "Bag" : "Bird"),
    farmer_price: initialData?.farmer_price ?? "",
    location: initialData?.location ?? "",
    description: initialData?.description ?? "",
    brand: initialData?.brand ?? "",
    feed_category: (initialData as any)?.feed_category ?? "",
    is_featured_banner: initialData?.is_featured_banner ?? false,
    specifications: initialData?.specifications ?? "",
    target_audience: initialData?.target_audience ?? "both",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title ?? "",
        category: initialData.category ?? ("broiler" as any),
        breed: initialData.breed ?? "",
        quantity: initialData.quantity ?? 10,
        unit: initialData.unit ?? (initialData.category === "feed" ? "Bag" : "Bird"),
        farmer_price: initialData.farmer_price ?? "",
        location: initialData.location ?? "",
        description: initialData.description ?? "",
        brand: initialData.brand ?? "",
        feed_category: (initialData as any).feed_category ?? "",
        is_featured_banner: initialData.is_featured_banner ?? false,
        specifications: initialData.specifications ?? "",
        target_audience: initialData.target_audience ?? "both",
      });
      setImages(initialData.images ?? []);
      setProductType(initialData.category === "feed" ? "feed" : "chicken");
    }
  }, [initialData]);

  const handleProductTypeChange = (type: "chicken" | "feed") => {
    setProductType(type);
    setForm((prev) => ({
      ...prev,
      unit: type === "feed" ? "Bag" : "Bird",
      category: type === "feed" ? "feed" : "broiler",
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin && (Number(form.farmer_price) <= 0 || Number.isNaN(Number(form.farmer_price)))) {
      toast.error("Please enter a valid positive price.");
      return;
    }
    if (productType === "feed" && !form.feed_category) {
      toast.error("Please select a Feed Category.");
      return;
    }
    setSubmitting(true);
    try {
      const submitData = {
        title: form.title,
        category: productType === "feed" ? "feed" : form.category,
        breed: productType === "feed" ? null : (form.breed || null),
        quantity: Number(form.quantity),
        unit: form.unit,
        farmer_price: isAdmin ? Number(form.farmer_price) : 0,
        location: form.location || null,
        description: form.description || null,
        brand: productType === "feed" ? form.brand : null,
        feed_category: productType === "feed" ? form.feed_category : null,
        is_featured_banner: isAdmin ? form.is_featured_banner : false,
        specifications: productType === "feed" ? form.specifications : null,
        target_audience: isAdmin ? form.target_audience : "both",
      };
      await onSubmit(submitData, images);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Product Type Selector */}
      {isAdmin && showProductTypeSelector && (
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
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={
              titlePlaceholder ??
              (productType === "chicken"
                ? "Healthy broiler chickens, 8 weeks"
                : "Premium poultry grower feed")
            }
          />
        </div>

        {/* Dynamic Fields based on Product Type */}
        {productType === "chicken" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category *</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["broiler", "layer", "chick", "egg", "other"].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="breed">Breed (optional)</Label>
              <Input
                id="breed"
                value={form.breed}
                onChange={(e) => setForm({ ...form, breed: e.target.value })}
                placeholder="E.g., Cobb 500"
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                required={productType === "feed"}
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="E.g., Suguna Feed"
              />
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
              <Input
                id="specifications"
                value={form.specifications}
                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                placeholder="Protein: 21%, Fiber: 5%"
              />
            </div>
          </div>
        )}

        <div className={`grid gap-4 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <div>
            <Label htmlFor="quantity">Quantity (Stock) *</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Unit *</Label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {productType === "chicken"
                  ? ["Bird", "Crate", "Kg", "Other"].map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))
                  : ["Bag", "Kg", "Gram", "Tonne"].map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <div>
              <Label htmlFor="price">
                {isEdit ? "Your Price (per unit) *" : "Asking Price (per unit) *"}
              </Label>
              <Input
                id="price"
                type="number"
                min={isEdit ? "0" : "0.01"}
                step="0.01"
                required
                value={form.farmer_price}
                onChange={(e) => setForm({ ...form, farmer_price: e.target.value })}
                placeholder="Enter price"
              />
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Village, City, or District"
          />
        </div>

        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={
              descriptionPlaceholder ??
              (productType === "chicken"
                ? "Diet, age, vaccination schedule..."
                : "Key ingredients, feeding guidelines...")
            }
          />
        </div>

        {/* Featured Banner Switch - Admin Only */}
        {isAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/80 bg-secondary/10">
              <div>
                <Label htmlFor="is_featured_banner" className="font-bold text-foreground">
                  Featured Banner
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show this listing in the marketplace hero promotion slides
                </p>
              </div>
              <Switch
                id="is_featured_banner"
                checked={form.is_featured_banner}
                onCheckedChange={(checked) => setForm({ ...form, is_featured_banner: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_audience" className="font-bold text-foreground">
                Target Audience
              </Label>
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
              <p className="text-[11px] text-muted-foreground">
                Determine who can see this product listing in the marketplace.
              </p>
            </div>
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

        <div className="flex justify-between items-center pt-2">
          {isEdit && onArchive ? (
            <Button type="button" variant="ghost" onClick={onArchive} className="text-destructive">
              Archive listing
            </Button>
          ) : (
            <Button type="button" variant="ghost" asChild>
              <span onClick={onCancel} className="cursor-pointer">Cancel</span>
            </Button>
          )}
          <div className="flex gap-3">
            {isEdit && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? "Submitting…" : submitButtonText}
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
