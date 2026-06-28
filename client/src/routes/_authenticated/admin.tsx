import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Users, Tags, ShoppingBag, BarChart3 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { adminAnalytics, adminGetSettings, adminUpdateSettings } from "@/lib/admin.functions";
import { useRequireRole } from "@/hooks/use-require-role";
import { formatPrice } from "@/lib/format";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/listings", label: "Listings", icon: Tags },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

function AdminLayout() {
  useRequireRole(["admin"]);
  const qc = useQueryClient();
  const fn = useServerFn(adminAnalytics);
  const getSettingsFn = useServerFn(adminGetSettings);
  const updateSettingsFn = useServerFn(adminUpdateSettings);

  const q = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fn() });
  const a = q.data;

  // Settings query
  const settingsQ = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => getSettingsFn(),
  });
  const autoApprove = settingsQ.data?.auto_approve_users ?? false;

  // Settings mutation
  const settingsMutation = useMutation({
    mutationFn: (checked: boolean) => updateSettingsFn({ data: { auto_approve_users: checked } }),
    onMutate: async (checked) => {
      await qc.cancelQueries({ queryKey: ["admin-settings"] });
      const previous = qc.getQueryData(["admin-settings"]);
      qc.setQueryData(["admin-settings"], { auto_approve_users: checked });
      return { previous };
    },
    onError: (err, checked, context: any) => {
      if (context?.previous) {
        qc.setQueryData(["admin-settings"], context.previous);
      }
      toast.error("Failed to update auto-approval setting");
    },
    onSuccess: (data, checked) => {
      toast.success(checked ? "Auto-approval enabled" : "Auto-approval disabled");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
  });

  const handleToggleAutoApprove = (checked: boolean) => {
    settingsMutation.mutate(checked);
  };

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold text-primary">Admin control</h1>
            <p className="mt-1 text-muted-foreground">Approvals, pricing, and platform oversight.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Auto-approve new users</span>
              <span className="text-xs text-muted-foreground">Approve all new farmers & buyers instantly</span>
            </div>
            <Switch
              checked={autoApprove}
              onCheckedChange={handleToggleAutoApprove}
              disabled={settingsMutation.isPending}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pending users" value={(a?.counts.pendingUsers ?? 0).toString()} accent />
          <Stat label="Live listings" value={(a?.counts.liveListings ?? 0).toString()} />
          <Stat label="Orders" value={(a?.counts.orders ?? 0).toString()} />
          <Stat label="Gross revenue" value={formatPrice(a?.revenue ?? 0)} />
        </div>

        <nav className="mt-10 flex flex-wrap gap-2 border-b border-border">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.exact }}
              activeProps={{ className: "border-primary text-primary" }}
              inactiveProps={{ className: "border-transparent text-muted-foreground hover:text-foreground" }}
              className="inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition"
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-soft ${accent ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold text-foreground">{value}</div>
    </div>
  );
}
