import { Link } from "@tanstack/react-router";
import { Heart, MessageSquare } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 bg-secondary/40 backdrop-blur-sm">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <div className="font-display text-2xl font-bold tracking-tight text-primary">Henhouse</div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            A trusted, controlled poultry marketplace connecting approved farmers and buyers under careful administrative oversight.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-foreground">Platform</div>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link to="/" className="transition-colors hover:text-primary">Home</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-primary">How it works</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <div className="font-semibold text-foreground">Get started</div>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link to="/auth" className="transition-colors hover:text-primary">Sign in</Link></li>
            <li><Link to="/auth" search={{ mode: "signup", role: "farmer" } as any} className="transition-colors hover:text-primary">Register as farmer</Link></li>
            <li><Link to="/auth" search={{ mode: "signup", role: "buyer" } as any} className="transition-colors hover:text-primary">Register as buyer</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6 text-xs text-muted-foreground bg-secondary/20">
        <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            © {new Date().getFullYear()} Henhouse Marketplace. All rights reserved.
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by{" "}
              <span className="font-semibold text-foreground">Dzinscript</span>
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <a
              href="https://wa.me/919284275573"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:text-accent transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5 text-accent" /> Phone: +91 9284275573
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

