import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  role: z.enum(["farmer", "buyer"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Sign in — Henhouse" },
      { name: "description", content: "Sign in or register for the Henhouse poultry marketplace." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { mode: initialMode, role: initialRole } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [role, setRole] = useState<"farmer" | "buyer">(initialRole ?? "buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName,
              phone,
              farm_name: role === "farmer" ? farmName : null,
              role,
            },
          },
        });
        if (error) throw error;
        toast.success("Account created — waiting for admin approval.");
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard", replace: true });
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-gradient-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-background/15">
            <Sprout className="h-5 w-5" />
          </span>
          Henhouse
        </Link>
        <div>
          <h1 className="font-display text-4xl leading-tight">
            A controlled marketplace for trusted poultry trade.
          </h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Approved farmers, transparent pricing, and end-to-end order tracking — all in one place.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} Henhouse Marketplace
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8">
            <Link to="/" className="inline-flex items-center gap-2 font-display text-xl font-semibold text-primary">
              <Sprout className="h-5 w-5" /> Henhouse
            </Link>
          </div>
          <h2 className="font-display text-3xl font-semibold text-foreground">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup"
              ? "New accounts are reviewed by an admin before access is granted."
              : "Sign in to access your marketplace."}
          </p>

          <Button variant="outline" className="mt-6 w-full" onClick={handleGoogle} disabled={loading}>
            Continue with Google
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <>
                <div>
                  <Label className="mb-2 block">I am a…</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(v) => setRole(v as "farmer" | "buyer")}
                    className="grid grid-cols-2 gap-3"
                  >
                    {(["buyer", "farmer"] as const).map((r) => (
                      <label
                        key={r}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 capitalize ${
                          role === r
                            ? "border-primary bg-secondary"
                            : "border-border hover:bg-secondary/50"
                        }`}
                      >
                        <RadioGroupItem value={r} />
                        <span className="font-medium">{r}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {role === "farmer" && (
                  <div>
                    <Label htmlFor="farmName">Farm name</Label>
                    <Input id="farmName" required value={farmName} onChange={(e) => setFarmName(e.target.value)} />
                  </div>
                )}
              </>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" variant="hero" size="lg" disabled={loading}>
              {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="font-medium text-primary hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
