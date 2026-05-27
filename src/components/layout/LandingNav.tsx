import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "../ui/Button";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent",
      ].join(" ")}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
        {/* Wordmark */}
        <Link
          to="/"
          className="hover:opacity-80 transition-opacity"
        >
          <img src="/logo.png" alt="OneSheet" className="h-8" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#templates" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Templates
          </a>
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <Link to="/sign-in" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link to="/sign-up">
            <Button variant="primary" size="default">
              Get started
            </Button>
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-foreground"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-background border-b border-border px-6 py-4 flex flex-col gap-3">
          <a href="#features" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground py-2">
            Features
          </a>
          <a href="#templates" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground py-2">
            Templates
          </a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground py-2">
            Pricing
          </a>
          <Link to="/sign-in" onClick={() => setMenuOpen(false)} className="text-sm text-muted-foreground py-2">
            Sign in
          </Link>
          <Link to="/sign-up" onClick={() => setMenuOpen(false)}>
            <Button variant="primary" className="w-full">
              Get started
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
