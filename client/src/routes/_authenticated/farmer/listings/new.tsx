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

export const Route = createFileRoute("/_authenticated/farmer/listings/new")({
  component: NewListing,
});

function NewListing() {
  useRequireRole(["farmer"]);
  const navigate = useNavigate();
  const fn = useServerFn(createListing);
  const [submitting, setSubmitting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "broiler" as "broiler" | "layer" | "chick" | "egg" | "other",
    breed: "",
    quantity: 10,
    unit: "Bird",
    farmer_price: "" as any,
    location: "",
    description: "",
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const res = await api.post("/api/listings/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setImageUrls([...imageUrls, res.data.url]);
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
    setSubmitting(true);
    try {
      await fn({
        data: {
          title: form.title,
          category: form.category,
          breed: form.breed || null,
          quantity: Number(form.quantity),
          unit: form.unit,
          farmer_price: Number(form.farmer_price),
          location: form.location || null,
          description: form.description || null,
          image_urls: imageUrls,
        },
      });
      toast.success("Listing submitted — admin will price it shortly");
      navigate({ to: "/farmer" });
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
        <Link to="/farmer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">New listing</h1>
        <p className="mt-1 text-muted-foreground">
          Set your asking price — the admin will set the final buyer-facing price before publishing.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Healthy broiler chickens, 8 weeks" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category</Label>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={0} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {["Bird", "Crate", "Kg"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price">Your price (per unit)</Label>
              <Input id="price" type="number" min="0.01" step="0.01" required value={form.farmer_price} onChange={(e) => setForm({ ...form, farmer_price: e.target.value })} placeholder="Enter price" />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ibadan, Oyo State" />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell buyers about your birds — diet, age, health, anything special." />
          </div>
          <div>
            <Label>Listing Images</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-border">
                  <img src={url} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                    className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {imageUrls.length < 8 && (
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
            <Button type="button" variant="ghost" asChild><Link to="/farmer">Cancel</Link></Button>
            <Button type="submit" variant="hero" disabled={submitting}>{submitting ? "Submitting…" : "Submit listing"}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
