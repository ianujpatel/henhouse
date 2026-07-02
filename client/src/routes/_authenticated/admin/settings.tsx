import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { Megaphone, Coins, Upload, X, Clock, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import { getGlobalSettings, updateGlobalSettings } from "@/lib/global-settings.functions";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettingsPage,
});

const VISIBILITY_OPTIONS = [
  { value: "all", label: "All Pages" },
  { value: "home", label: "Home Page" },
  { value: "buyer", label: "Buyer Pages" },
  { value: "farmer", label: "Farmer Pages" },
  { value: "hidden", label: "Hide Completely" },
];

type VisibilityType = "home" | "buyer" | "farmer" | "all" | "hidden";

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const getSettingsFn = useServerFn(getGlobalSettings);
  const updateSettingsFn = useServerFn(updateGlobalSettings);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["global-settings"],
    queryFn: () => getSettingsFn(),
  });

  const [bannerVisibility, setBannerVisibility] = useState<VisibilityType>("hidden");
  const [bannerText, setBannerText] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [bannerRedirectUrl, setBannerRedirectUrl] = useState("");
  const [pricesVisibility, setPricesVisibility] = useState<VisibilityType>("hidden");
  const [chicksPrice, setChicksPrice] = useState("");
  const [birdsPrice, setBirdsPrice] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      setBannerVisibility(settings.banner_visibility || (settings.banner_show ? "all" : "hidden"));
      setBannerText(settings.banner_text || "");
      setBannerImageUrl(settings.banner_image_url || "");
      setBannerRedirectUrl(settings.banner_redirect_url || "");
      setPricesVisibility(settings.prices_visibility || (settings.prices_show ? "all" : "hidden"));
      setChicksPrice(settings.chicks_price ? settings.chicks_price.toString() : "");
      setBirdsPrice(settings.birds_price ? settings.birds_price.toString() : "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateSettingsFn({
        data: {
          banner_visibility: bannerVisibility,
          banner_text: bannerText,
          banner_image_url: bannerImageUrl,
          banner_redirect_url: bannerRedirectUrl,
          prices_visibility: pricesVisibility,
          chicks_price: Number(chicksPrice) || 0,
          birds_price: Number(birdsPrice) || 0,
        },
      }),
    onSuccess: () => {
      toast.success("Global settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["global-settings"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to save settings");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setBannerImageUrl(res.data.secure_url);
      toast.success("Banner image uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteBanner = () => {
    if (confirm("Delete the announcement banner content? This clears the image, text, and redirect URL.")) {
      setBannerText("");
      setBannerImageUrl("");
      setBannerRedirectUrl("");
      toast.info("Banner content cleared. Click Save to apply changes.");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Banner Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Megaphone className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Top Announcement Banner</h2>
              <p className="text-xs text-muted-foreground">Set up an alert banner that appears dynamically</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="bannerVisibility" className="text-xs font-bold text-muted-foreground uppercase shrink-0">
              Visibility
            </Label>
            <Select value={bannerVisibility} onValueChange={(v: VisibilityType) => setBannerVisibility(v)}>
              <SelectTrigger id="bannerVisibility" className="w-[180px] rounded-xl bg-card border border-border font-semibold shadow-soft">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <Label htmlFor="bannerText">Banner Text</Label>
              <Input
                id="bannerText"
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                placeholder="E.g., Special Feed discounts this week! Buy now."
              />
            </div>
            <div>
              <Label htmlFor="bannerRedirect">Redirect Link (Optional)</Label>
              <Input
                id="bannerRedirect"
                value={bannerRedirectUrl}
                onChange={(e) => setBannerRedirectUrl(e.target.value)}
                placeholder="E.g., https://example.com or /marketplace"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Banner Image (Optional)</Label>
            {bannerImageUrl ? (
              <div className="relative rounded-xl border border-border overflow-hidden bg-secondary/20 p-2">
                <img src={bannerImageUrl} className="h-32 w-full object-cover rounded-lg" alt="Banner Preview" />
                <button
                  type="button"
                  onClick={() => setBannerImageUrl("")}
                  className="absolute right-4 top-4 rounded-full bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90 shadow-md cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border hover:bg-secondary/40 rounded-xl cursor-pointer transition">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="mt-2 text-xs font-bold text-muted-foreground">Upload banner image</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WEBP (Max 10MB)</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
            {uploading && <p className="text-xs text-muted-foreground">Uploading banner image...</p>}
          </div>
        </div>

        {(bannerText || bannerImageUrl || bannerRedirectUrl) && (
          <div className="flex justify-end pt-2 border-t border-border/40">
            <Button type="button" variant="ghost" className="text-destructive font-semibold hover:bg-destructive/5" onClick={handleDeleteBanner}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Banner Content
            </Button>
          </div>
        )}
      </div>

      {/* Prices Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <Coins className="h-5 w-5 text-accent" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Today's Daily Prices</h2>
              <p className="text-xs text-muted-foreground">Broadcast official market rates dynamically</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="pricesVisibility" className="text-xs font-bold text-muted-foreground uppercase shrink-0">
              Visibility
            </Label>
            <Select value={pricesVisibility} onValueChange={(v: VisibilityType) => setPricesVisibility(v)}>
              <SelectTrigger id="pricesVisibility" className="w-[180px] rounded-xl bg-card border border-border font-semibold shadow-soft">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="chicksPrice">Today's Chicks Price (₹ per bird) *</Label>
            <Input
              id="chicksPrice"
              type="number"
              min="0"
              step="0.01"
              required={pricesVisibility !== "hidden"}
              value={chicksPrice}
              onChange={(e) => setChicksPrice(e.target.value)}
              placeholder="E.g., 35"
            />
          </div>
          <div>
            <Label htmlFor="birdsPrice">Today's Birds Price (₹ per kg) *</Label>
            <Input
              id="birdsPrice"
              type="number"
              min="0"
              step="0.01"
              required={pricesVisibility !== "hidden"}
              value={birdsPrice}
              onChange={(e) => setBirdsPrice(e.target.value)}
              placeholder="E.g., 98"
            />
          </div>
        </div>

        {settings?.prices_updated_at && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Prices last updated: {new Date(settings.prices_updated_at).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Save Action */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" variant="hero" className="rounded-xl font-bold px-6 h-11" disabled={saveMutation.isPending}>
          <Save className="mr-2 h-4 w-4" /> {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}

