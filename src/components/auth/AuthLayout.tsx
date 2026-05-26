import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Split-panel auth layout.
 * Left: Dark brand panel with photography.
 * Right: Form content on warm ivory.
 * Mobile: Brand panel becomes a compact header.
 */
export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Brand panel — left on desktop, top bar on mobile */}
      <div className="relative lg:w-[45%] lg:min-h-screen overflow-hidden">
        {/* Background image */}
        <img
          src="/images/hero-workspace.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-primary/88" />

        {/* Content */}
        <div className="relative flex flex-col justify-between p-8 lg:p-12 min-h-[200px] lg:min-h-screen">
          <Link
            to="/"
            className="font-heading text-xl font-semibold text-white/90 hover:text-white transition-colors"
          >
            OneSheet
          </Link>

          <div className="hidden lg:block mt-auto">
            <h2 className="font-heading text-3xl font-semibold text-white leading-snug mb-3">
              Your resume,
              <br />
              crafted in Markdown.
            </h2>
            <p className="text-white/60 max-w-sm leading-relaxed">
              Write it in the format you know. Pick a template.
              Export a pixel-perfect PDF or share a public link.
            </p>
          </div>
        </div>
      </div>

      {/* Form panel — right on desktop, full width on mobile */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 lg:py-0">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
