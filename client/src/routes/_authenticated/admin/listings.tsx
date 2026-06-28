import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminListAllListings, adminSetBuyerPrice } from "@/lib/admin.functions";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/listings")({
  component: AdminListings,
});

function AdminListings() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAllListings);
  const priceFn = useServerFn(adminSetBuyerPrice);
  const q = useQuery({ queryKey: ["admin-listings"], queryFn: () => listFn() });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function publish(id: string, buyer_price: number) {
    try {
      await priceFn({ data: { id, buyer_price, publish: true } });
      toast.success("Buyer price set & listing live");
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  const rows = q.data ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Listing</th>
            <th className="px-5 py-3">Farmer</th>
            <th className="px-5 py-3">Qty</th>
            <th className="px-5 py-3">Farmer price</th>
            <th className="px-5 py-3">Buyer price</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l: any) => {
            const draft = drafts[l.id] ?? (l.buyer_price ?? "");
            return (
              <tr key={l.id} className="border-t border-border">
                <td className="px-5 py-4">
                  <div className="font-medium text-foreground">{l.title}</div>
                  <div className="text-xs capitalize text-muted-foreground">{l.category}</div>
                </td>
                <td className="px-5 py-4 text-muted-foreground">{l.profiles?.farm_name ?? l.profiles?.full_name ?? "—"}</td>
                <td className="px-5 py-4">{l.quantity} {l.unit}</td>
                <td className="px-5 py-4">{formatPrice(l.farmer_price)}</td>
                <td className="px-5 py-4">
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={draft}
                    onChange={(e) => setDrafts({ ...drafts, [l.id]: e.target.value })}
                    className="w-32"
                  />
                </td>
                <td className="px-5 py-4 capitalize text-muted-foreground">{l.status.replace("_", " ")}</td>
                <td className="px-5 py-4 text-right">
                  <Button size="sm" variant="hero" onClick={() => publish(l.id, Number(draft))} disabled={!draft || Number(draft) <= 0}>
                    {l.status === "live" ? "Update price" : "Publish"}
                  </Button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No listings yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
