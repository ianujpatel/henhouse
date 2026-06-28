import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/40">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="font-display text-2xl font-semibold text-primary">Henhouse</div>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            A trusted poultry marketplace connecting farmers and buyers under careful
            administrative oversight.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-foreground">Platform</div>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/about" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-foreground">Get started</div>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
            <li><Link to="/auth" search={{ mode: "signup", role: "farmer" } as any} className="hover:text-foreground">Register as farmer</Link></li>
            <li><Link to="/auth" search={{ mode: "signup", role: "buyer" } as any} className="hover:text-foreground">Register as buyer</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Henhouse Marketplace
      </div>
    </footer>
  );
}
