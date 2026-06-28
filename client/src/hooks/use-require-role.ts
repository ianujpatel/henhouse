import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import type { AppRole } from "@/hooks/use-session";

/**
 * Ensures the current user is approved AND has at least one of the required roles.
 * If not approved, redirects to /pending. If lacks role, redirects to /dashboard.
 */
export function useRequireRole(roles: AppRole[]) {
  const navigate = useNavigate();
  const fn = useServerFn(getMe);
  const q = useQuery({ queryKey: ["me"], queryFn: () => fn() });

  useEffect(() => {
    if (!q.data) return;
    const status = q.data.profile?.status;
    if (status !== "approved") {
      navigate({ to: "/pending", replace: true });
      return;
    }
    const has = q.data.roles.some((r: any) => roles.includes(r));
    if (!has) navigate({ to: "/dashboard", replace: true });
  }, [q.data, navigate, roles]);

  return q;
}
