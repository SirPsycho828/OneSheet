import { Link } from "react-router-dom";
import { Button } from "../ui/Button";

/**
 * Sticky navigation bar for the landing page.
 *
 * - Sticky top, frosted-glass background
 * - Left: BragSheet wordmark
 * - Right: Sign in (ghost, hidden on mobile), Get Started (primary)
 */
export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      {/* Wordmark */}
      <Link
        to="/"
        className="text-lg font-semibold tracking-tight text-gray-950 hover:text-brand-500 transition-colors"
      >
        BragSheet
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <Link to="/sign-in" className="hidden md:block">
          <Button variant="ghost">Sign in</Button>
        </Link>
        <Link to="/sign-up">
          <Button variant="primary">Get Started</Button>
        </Link>
      </div>
    </header>
  );
}
