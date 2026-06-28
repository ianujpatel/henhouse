import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: () => (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
      <h2 className="font-display text-2xl font-semibold text-foreground">Welcome, admin</h2>
      <p className="mt-2 text-muted-foreground">
        Use the tabs above to approve users, set buyer pricing on new listings, and manage orders.
      </p>
    </div>
  ),
});
