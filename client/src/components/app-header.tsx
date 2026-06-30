import { Link, useRouter } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, LogOut, Menu, Sprout, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getMe } from "@/lib/me.functions";
import {
  listMyNotifications,
  markNotificationRead,
} from "@/lib/notifications.functions";

export function AppHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const getMeFn = useServerFn(getMe);
  const listNotifsFn = useServerFn(listMyNotifications);
  const markReadFn = useServerFn(markNotificationRead);
  const [open, setOpen] = useState(false);
  const { cartCount } = useCart();

  const meQ = useQuery({ queryKey: ["me"], queryFn: () => getMeFn(), retry: false });
  const notifsQ = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifsFn(),
    refetchInterval: 30_000,
    enabled: !!meQ.data,
  });

  const me = meQ.data;
  const roles = me?.roles ?? [];
  const isAdmin = roles.includes("admin");
  const isFarmer = roles.includes("farmer");
  const isBuyer = roles.includes("buyer");
  const approved = me?.profile?.status === "approved";

  const links: Array<{ to: string; label: string }> = [];
  if (approved) {
    if (isBuyer || isAdmin) links.push({ to: "/marketplace", label: "Marketplace" });
    if (isBuyer) links.push({ to: "/orders", label: "My Orders" });
    if (isFarmer) links.push({ to: "/farmer", label: "Farmer Dashboard" });
    if (isAdmin) links.push({ to: "/admin", label: "Admin" });
  }

  const unread = (notifsQ.data ?? []).filter((n: any) => !n.read_at).length;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await auth.signOut();
    router.navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold text-primary">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <Sprout className="h-5 w-5" />
          </span>
          <span>Henhouse</span>
        </Link>

        <nav className="ml-6 hidden gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&.active]:bg-secondary [&.active]:text-foreground"
              activeProps={{ className: "active" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {me ? (
            <>
              {isBuyer && (
                <Link
                  to="/cart"
                  className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shadow-soft"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {cartCount > 0 && (
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-accent-foreground">
                      {cartCount}
                    </span>
                  )}
                </Link>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                      <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                        {unread}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(notifsQ.data ?? []).length === 0 && (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      You're all caught up.
                    </div>
                  )}
                  {(notifsQ.data ?? []).slice(0, 10).map((n: any) => (
                    <DropdownMenuItem
                      key={n.id}
                      className="flex cursor-pointer flex-col items-start gap-0.5"
                      onClick={async () => {
                        if (!n.read_at) {
                          await markReadFn({ data: { id: n.id } });
                          queryClient.invalidateQueries({ queryKey: ["notifications"] });
                        }
                      }}
                    >
                      <div className="flex w-full items-center gap-2">
                        {!n.read_at && <span className="h-2 w-2 rounded-full bg-accent" />}
                        <span className="font-medium">{n.title}</span>
                      </div>
                      {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="hidden md:inline-flex">
                    {me.profile?.full_name?.split(" ")[0] || "Account"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {me.profile?.full_name}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {roles.map((r: string) => (
                        <span key={r} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wide text-secondary-foreground">
                          {r}
                        </span>
                      ))}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <nav className="mt-8 flex flex-col gap-2">
                    {links.map((l) => (
                      <Link
                        key={l.to}
                        to={l.to}
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2 text-base font-medium hover:bg-secondary"
                      >
                        {l.label}
                      </Link>
                    ))}
                    <button
                      onClick={signOut}
                      className="mt-4 rounded-md px-3 py-2 text-left text-base font-medium text-destructive hover:bg-secondary"
                    >
                      Sign out
                    </button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button variant="accent" asChild>
                <Link to="/auth" search={{ mode: "signup" } as any}>
                  Get started
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
