import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";

const searchSchema = z.object({
  token: z.string().catch(""),
});

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Reset Password — Henhouse" },
      { name: "description", content: "Reset your Henhouse account password." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Invalid reset link. Token is missing.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await auth.resetPassword(token, password);
      if (error) {
        throw error;
      }
      toast.success("Password has been reset successfully. Please login with your new password.");
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-gradient-hero p-12 text-primary-foreground md:flex md:flex-col md:justify-between">
        <div className="inline-flex items-center gap-2 font-display text-xl font-semibold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-background/15">
            <Sprout className="h-5 w-5" />
          </span>
          Henhouse
        </div>
        <div>
          <h1 className="font-display text-4xl leading-tight">
            Reset Your Account Password
          </h1>
          <p className="mt-4 max-w-md text-primary-foreground/80">
            Securely update your password to regain access to the poultry marketplace.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">
          © {new Date().getFullYear()} Henhouse Marketplace
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-8">
            <div className="inline-flex items-center gap-2 font-display text-xl font-semibold text-primary">
              <Sprout className="h-5 w-5" /> Henhouse
            </div>
          </div>
          <h2 className="font-display text-3xl font-semibold text-foreground">
            Set New Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please enter and confirm your new account password below.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button type="submit" className="w-full" variant="hero" size="lg" disabled={loading || !token}>
              {loading ? "Please wait…" : "Reset Password"}
            </Button>
          </form>

          {!token && (
            <p className="mt-4 text-sm text-destructive text-center font-medium">
              Warning: Reset token is missing. Please use the link provided in your email.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
