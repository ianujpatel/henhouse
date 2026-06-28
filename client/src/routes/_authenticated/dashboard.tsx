import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { getMe } from "@/lib/me.functions";
import { AppHeader } from "@/components/app-header";

/**
 * Smart redirect after sign-in based on role and approval status.
 */
export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRouter,
});

function DashboardRouter() {
  const navigate = useNavigate();
  const fn = useServerFn(getMe);
  const q = useQuery({ queryKey: ["me"], queryFn: () => fn() });

  useEffect(() => {
    if (q.isLoading || !q.data) return;
    const me = q.data;
    if (me.profile?.status !== "approved") {
      navigate({ to: "/pending", replace: true });
      return;
    }
    if (me.roles.includes("admin")) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    if (me.roles.includes("farmer")) {
      navigate({ to: "/farmer", replace: true });
      return;
    }
    navigate({ to: "/marketplace", replace: true });
  }, [q.data, q.isLoading, navigate]);

  return <LoadingShell />;
}


function LoadingShell() {
  return (
    <div>
      <AppHeader />
      <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">
        Loading your dashboard…
      </div>
    </div>
  );
}
