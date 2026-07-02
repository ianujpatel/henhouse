import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { adminListUsers, adminSetUserStatus } from "@/lib/admin.functions";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

const STATUS_TONE: Record<string, string> = {
  pending: "bg-warning/25 text-warning-foreground",
  approved: "bg-success/20 text-success",
  rejected: "bg-destructive/15 text-destructive",
};

function AdminUsers() {
  const qc = useQueryClient();
  const listFn = useServerFn(adminListUsers);
  const setFn = useServerFn(adminSetUserStatus);
  const q = useQuery({ queryKey: ["admin-users"], queryFn: () => listFn() });

  async function setStatus(userId: string, status: "approved" | "rejected" | "pending") {
    try {
      await setFn({ data: { userId, status } });
      toast.success(`User ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  }

  if (q.isLoading) return <div className="text-muted-foreground">Loading…</div>;
  const users = q.data ?? [];

  return (
    <div className="overflow-hidden overflow-x-auto w-full rounded-2xl border border-border bg-card shadow-soft">
      <table className="w-full text-sm min-w-[700px]">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Roles</th>
            <th className="px-5 py-3">Joined</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className="border-t border-border align-middle">
              <td className="px-5 py-4">
                <div className="font-medium text-foreground">{u.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{u.farm_name ?? u.phone ?? ""}</div>
              </td>
              <td className="px-5 py-4 capitalize text-muted-foreground">{u.roles.join(", ") || "—"}</td>
              <td className="px-5 py-4">{formatDate(u.created_at)}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-2.5 py-1 text-xs capitalize ${STATUS_TONE[u.status] ?? ""}`}>{u.status}</span>
              </td>
              <td className="px-5 py-4 text-right">
                {u.status !== "approved" && (
                  <Button size="sm" variant="hero" onClick={() => setStatus(u.id, "approved")}>Approve</Button>
                )}
                {u.status !== "rejected" && (
                  <Button size="sm" variant="ghost" className="ml-2 text-destructive" onClick={() => setStatus(u.id, "rejected")}>Reject</Button>
                )}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No users yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
