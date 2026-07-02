import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminListAllOrders, adminSetOrderStatus } from "@/lib/admin.functions";
import { formatDate, formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "placed", "confirmed", "fulfilled", "cancelled"];

function AdminOrders() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListAllOrders);
  const setFn = useServerFn(adminSetOrderStatus);
  const q = useQuery({ queryKey: ["admin-orders"], queryFn: () => listFn() });

  async function setStatus(id: string, status: string) {
    try {
      await setFn({ data: { id, status: status as any } });
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  const rows = q.data ?? [];

  return (
    <div className="overflow-hidden overflow-x-auto w-full rounded-2xl border border-border bg-card shadow-soft">
      <table className="w-full text-sm min-w-[850px]">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Order</th>
            <th className="px-5 py-3">Buyer</th>
            <th className="px-5 py-3">Placed</th>
            <th className="px-5 py-3">Total</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((o: any) => (
            <tr key={o.id} className="border-t border-border">
              <td className="px-5 py-4 font-mono text-xs">#{o.id.slice(0, 8)}</td>
              <td className="px-5 py-4">
                <div className="font-semibold text-foreground">{o.buyer?.full_name ?? "—"}</div>
                {o.delivery_full_name && (
                  <div className="mt-1.5 text-xs text-muted-foreground bg-secondary/30 p-2 rounded-lg border border-border/50 max-w-sm">
                    <div className="font-medium text-foreground">{o.delivery_full_name} ({o.delivery_mobile})</div>
                    <div>{o.delivery_address}, {o.delivery_city}, {o.delivery_district}, {o.delivery_state} - {o.delivery_pincode}</div>
                    {o.delivery_landmark && <div className="text-[10px] text-primary/70 font-medium">Landmark: {o.delivery_landmark}</div>}
                    {o.delivery_notes && <div className="italic text-[10px] text-muted-foreground mt-0.5">Notes: {o.delivery_notes}</div>}
                  </div>
                )}
              </td>
              <td className="px-5 py-4">{formatDate(o.placed_at)}</td>
              <td className="px-5 py-4 font-semibold text-primary">{formatPrice(o.total)}</td>
              <td className="px-5 py-4 capitalize">{o.status}</td>
              <td className="px-5 py-4 text-right">
                <div className="inline-flex items-center gap-2">
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">No orders yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
