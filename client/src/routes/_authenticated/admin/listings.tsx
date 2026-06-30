import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Power, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminListAllListings, adminSetBuyerPrice } from "@/lib/admin.functions";
import { archiveListing } from "@/lib/listings.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

function AdminListings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAllListings);
  const priceFn = useServerFn(adminSetBuyerPrice);
  const archiveFn = useServerFn(archiveListing);

  const q = useQuery({ queryKey: ["admin-listings"], queryFn: () => listFn() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const archiveMutation = useMutation({
    mutationFn: archiveFn,
    onSuccess: () => {
      toast.success("Listing archived successfully");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to archive listing");
    },
  });

  async function publish(id: string, buyer_price: number, makeLive: boolean = true) {
    try {
      await priceFn({ data: { id, buyer_price, publish: makeLive } });
      toast.success(makeLive ? "Listing published live!" : "Listing updated");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to archive/delete this listing? It will no longer show on the marketplace.")) {
      archiveMutation.mutate({ data: { id } });
    }
  };

  const toggleStatus = async (l: any) => {
    const isLive = l.status === "live";
    const draftPrice = drafts[l.id] || l.buyer_price || l.farmer_price;
    if (!draftPrice || Number(draftPrice) <= 0) {
      toast.error("Please specify a valid buyer price before activating.");
      return;
    }
    
    try {
      await priceFn({ data: { id: l.id, buyer_price: Number(draftPrice), publish: !isLive } });
      toast.success(isLive ? "Listing deactivated (moved to pending)" : "Listing activated (live)");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to change listing status");
    }
  };

  if (q.isLoading) return <div className="text-muted-foreground py-10 text-center">Loading listings...</div>;
  const rows = q.data ?? [];

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Marketplace Listings</h2>
          <p className="text-xs text-muted-foreground">Manage and set prices for chickens and feeds listed on the marketplace.</p>
        </div>
        <Button onClick={() => navigate({ to: "/farmer/listings/new" })} variant="hero" size="sm" className="rounded-xl font-bold">
          <Plus className="h-4 w-4 mr-2" /> Create Listing
        </Button>
      </div>

      <div className="border border-border/80 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-secondary/40 border-b border-border/80">
              <th className="p-3 font-bold text-muted-foreground">Listing Info</th>
              <th className="p-3 font-bold text-muted-foreground">Seller Role / Name</th>
              <th className="p-3 font-bold text-muted-foreground">Qty / Unit</th>
              <th className="p-3 font-bold text-muted-foreground">Farmer Price</th>
              <th className="p-3 font-bold text-muted-foreground">Buyer Price (₹)</th>
              <th className="p-3 font-bold text-muted-foreground">Status</th>
              <th className="p-3 font-bold text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((l: any) => {
              const draft = drafts[l.id] ?? (l.buyer_price ?? "");
              const isLive = l.status === "live";
              const sellerRole = l.profiles?.roles?.includes("admin") ? "Admin" : "Farmer";

              return (
                <tr key={l.id}>
                  <td className="p-3">
                    <div className="font-semibold text-foreground">{l.title}</div>
                    <div className="text-[10px] capitalize text-muted-foreground">{l.category}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-foreground">
                      {l.profiles?.farm_name || l.profiles?.full_name || "System Admin"}
                    </div>
                    {l.profiles?.full_name && l.profiles?.farm_name && (
                      <div className="text-[10px] text-muted-foreground">{l.profiles.full_name}</div>
                    )}
                    <span className={`text-[9px] font-bold uppercase rounded px-1.5 py-0.5 inline-block mt-1 ${
                      sellerRole === "Admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                    }`}>
                      {sellerRole}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-foreground">{l.quantity} {l.unit}s</td>
                  <td className="p-3 font-medium text-muted-foreground">{formatPrice(l.farmer_price)}</td>
                  <td className="p-3">
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={draft}
                      onChange={(e) => setDrafts({ ...drafts, [l.id]: e.target.value })}
                      className="w-24 h-8 rounded-lg"
                    />
                  </td>
                  <td className="p-3 capitalize">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      isLive
                        ? "bg-emerald-100 border-emerald-200 text-emerald-800"
                        : l.status === "archived"
                        ? "bg-red-100 border-red-200 text-red-800"
                        : "bg-amber-100 border-amber-200 text-amber-800"
                    }`}>
                      {l.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button
                        size="sm"
                        variant="hero"
                        onClick={() => publish(l.id, Number(draft))}
                        disabled={!draft || Number(draft) <= 0}
                        className="h-8 rounded-lg px-3 py-1 font-semibold text-[10px]"
                      >
                        {l.status === "live" ? "Update Price" : "Publish"}
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg"
                        title={isLive ? "Deactivate listing" : "Activate listing"}
                        onClick={() => toggleStatus(l)}
                      >
                        <Power className={`h-3.5 w-3.5 ${isLive ? "text-emerald-600" : "text-muted-foreground"}`} />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg"
                        title="Edit listing details"
                        onClick={() => navigate({ to: `/farmer/listings/${l.id}/edit` })}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/5 hover:text-destructive"
                        title="Archive/Delete listing"
                        onClick={() => handleDelete(l.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No listings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
