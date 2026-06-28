import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listMyListings, updateListing, archiveListing } from "@/lib/listings.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/_authenticated/farmer/listings/$id/edit")({
  component: EditListing,
});

function EditListing() {
  useRequireRole(["farmer"]);
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const listFn = useServerFn(listMyListings);
  const updateFn = useServerFn(updateListing);
  const archiveFn = useServerFn(archiveListing);
  const q = useQuery({ queryKey: ["my-listings"], queryFn: () => listFn() });
  const listing = (q.data ?? []).find((l: any) => l.id === id);

  const [form, setForm] = useState<any>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (listing && !form) {
      setForm({
        title: listing.title,
        breed: listing.breed ?? "",
        quantity: listing.quantity,
        unit: listing.unit,
        farmer_price: listing.farmer_price,
        location: listing.location ?? "",
        description: listing.description ?? "",
      });
      setImageUrls(listing.image_urls ?? []);
    }
  }, [listing, form]);

  if (q.isLoading || !form) return <div><AppHeader /><div className="container mx-auto p-12 text-muted-foreground">Loading…</div></div>;
  if (!listing) return <div><AppHeader /><div className="container mx-auto p-12">Listing not found.</div></div>;

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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateFn({
        data: {
          id,
          title: form.title,
          breed: form.breed || null,
          quantity: Number(form.quantity),
          unit: form.unit,
          farmer_price: Number(form.farmer_price),
          location: form.location || null,
          description: form.description || null,
          image_urls: imageUrls,
        },
      });
      toast.success("Listing updated");
      navigate({ to: "/farmer" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    }
  }

  async function archive() {
    if (!confirm("Archive this listing? It will no longer be visible to buyers.")) return;
    try {
      await archiveFn({ data: { id } });
      toast.success("Archived");
      navigate({ to: "/farmer" });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not archive");
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Link to="/farmer" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-primary">Edit listing</h1>
        <form onSubmit={save} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={0} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="price">Your price</Label>
              <Input id="price" type="number" min={0} step="0.01" value={form.farmer_price} onChange={(e) => setForm({ ...form, farmer_price: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <Label htmlFor="breed">Breed</Label>
            <Input id="breed" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
          <div className="flex justify-between pt-2">
            <Button type="button" variant="ghost" onClick={archive} className="text-destructive">Archive listing</Button>
            <Button type="submit" variant="hero">Save changes</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
