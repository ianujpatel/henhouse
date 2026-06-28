import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { getMe } from "@/lib/me.functions";

export const Route = createFileRoute("/_authenticated/pending")({
  component: PendingPage,
});

function PendingPage() {
  const fn = useServerFn(getMe);
  const q = useQuery({ queryKey: ["me"], queryFn: () => fn() });
  const status = q.data?.profile?.status ?? "pending";

  const Icon = status === "approved" ? CheckCircle2 : status === "rejected" ? XCircle : Clock;
  const tone = status === "approved" ? "text-success" : status === "rejected" ? "text-destructive" : "text-accent";

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="container mx-auto max-w-xl px-4 py-20">
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-card">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary ${tone}`}>
            <Icon className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-semibold text-foreground">
            {status === "approved"
              ? "You're approved!"
              : status === "rejected"
              ? "Account not approved"
              : "Awaiting approval"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {status === "approved"
              ? "You can now access the full platform."
              : status === "rejected"
              ? "Our team has decided not to approve your account at this time. If you believe this is a mistake, please contact support."
              : "Thanks for signing up. Our admin team reviews every account — you'll receive a notification as soon as you're approved."}
          </p>
          <div className="mt-8">
            {status === "approved" ? (
              <Button variant="hero" asChild>
                <Link to="/dashboard">Go to dashboard</Link>
              </Button>
            ) : (
              <Button variant="outline" asChild>
                <Link to="/contact">Contact support</Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
