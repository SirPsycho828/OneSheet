import { Link } from "react-router-dom";
import { Code, Layout, Download, Check } from "lucide-react";
import { LandingNav } from "../components/layout/LandingNav";
import { Button } from "../components/ui/Button";
import { PRESET_LIST } from "../constants/presets";
import { PRO_PRICE_MONTHLY } from "../constants/pricing";

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left — copy */}
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-gray-950 leading-tight">
            One page. Markdown. Done.
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed">
            Write your resume in Markdown. Pick a template. Get a pixel-perfect
            PDF and a shareable link. No fluff, no 50-template paralysis, no
            multi-page sprawl.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <Link to="/sign-up">
                <Button variant="primary" size="large">
                  Start writing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Free to use. PDF export on paid plan.
            </p>
          </div>
        </div>

        {/* Right — browser chrome mockup placeholder */}
        <div className="shadow-xl rounded-lg overflow-hidden border border-gray-200 bg-white">
          {/* Browser chrome */}
          <div className="h-8 bg-gray-100 border-b border-gray-200 flex items-center px-3 gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <div className="flex-1 mx-3">
              <div className="h-4 rounded bg-gray-200 max-w-[180px] mx-auto" />
            </div>
          </div>
          {/* Split editor preview placeholder */}
          <div className="flex h-72 lg:h-80">
            {/* Editor pane */}
            <div className="flex-1 bg-gray-950 p-4 flex flex-col gap-2">
              <div className="h-3 w-1/3 rounded bg-gray-700" />
              <div className="h-2.5 w-1/2 rounded bg-gray-800" />
              <div className="h-2.5 w-2/3 rounded bg-gray-800" />
              <div className="h-2.5 w-2/5 rounded bg-gray-800" />
              <div className="mt-2 h-3 w-1/4 rounded bg-blue-800" />
              <div className="h-2.5 w-3/5 rounded bg-gray-800" />
              <div className="h-2.5 w-1/2 rounded bg-gray-800" />
              <div className="mt-2 h-3 w-1/4 rounded bg-blue-800" />
              <div className="h-2.5 w-4/5 rounded bg-gray-800" />
              <div className="h-2.5 w-2/3 rounded bg-gray-800" />
              <div className="h-2.5 w-3/5 rounded bg-gray-800" />
            </div>
            {/* Divider */}
            <div className="w-px bg-gray-200" />
            {/* Preview pane */}
            <div className="flex-1 bg-white p-4 flex flex-col gap-2">
              <div className="h-4 w-1/2 rounded bg-gray-800 mx-auto" />
              <div className="h-2.5 w-1/3 rounded bg-gray-300 mx-auto" />
              <div className="mt-3 h-px bg-gray-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-gray-400" />
              <div className="h-2 w-full rounded bg-gray-200" />
              <div className="h-2 w-full rounded bg-gray-200" />
              <div className="h-2 w-4/5 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-1/4 rounded bg-gray-400" />
              <div className="h-2 w-full rounded bg-gray-200" />
              <div className="h-2 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How It Works
// ---------------------------------------------------------------------------

const HOW_IT_WORKS_STEPS = [
  {
    icon: Code,
    title: "Write in Markdown",
    description:
      "Your resume content in a format you already know. No drag-and-drop, no formatting toolbar. Just text.",
  },
  {
    icon: Layout,
    title: "Pick a template",
    description:
      "Choose from a handful of focused templates. Each one is designed for one page, period.",
  },
  {
    icon: Download,
    title: "Export or share",
    description:
      "Download a pixel-perfect PDF or share your public link: onesheet.cv/you",
  },
] as const;

function HowItWorks() {
  return (
    <section className="bg-gray-50 border-y border-gray-200 py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-gray-950 text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {HOW_IT_WORKS_STEPS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand-50">
                <Icon
                  className="text-brand-500"
                  size={28}
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-base font-semibold text-gray-950">{title}</h3>
              <p className="text-sm text-gray-700 leading-relaxed max-w-xs">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Template Showcase
// ---------------------------------------------------------------------------

function TemplateShowcase() {
  return (
    <section className="py-20">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-gray-950 text-center mb-12">
          Templates that respect the one-page rule
        </h2>

        {/* Mobile: horizontal scroll; Desktop: 5-column grid */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
          {PRESET_LIST.map((template) => (
            <div
              key={template.id}
              className="flex-shrink-0 w-40 md:w-auto snap-start"
            >
              {/* Thumbnail — US Letter aspect ratio (1:1.294) */}
              <div
                className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                style={{ aspectRatio: "1 / 1.294" }}
              >
                {/* Placeholder content simulating a resume */}
                <div className="p-3 flex flex-col gap-1.5 h-full">
                  <div className="h-2.5 w-2/3 rounded bg-gray-400" />
                  <div className="h-1.5 w-1/2 rounded bg-gray-300" />
                  <div className="mt-1 h-px bg-gray-300" />
                  <div className="h-1.5 w-1/3 rounded bg-gray-400" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="h-1.5 w-4/5 rounded bg-gray-200" />
                  <div className="mt-0.5 h-1.5 w-1/3 rounded bg-gray-400" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="h-1.5 w-3/4 rounded bg-gray-200" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="mt-0.5 h-1.5 w-1/3 rounded bg-gray-400" />
                  <div className="h-1.5 w-full rounded bg-gray-200" />
                  <div className="h-1.5 w-2/3 rounded bg-gray-200" />
                </div>
              </div>
              <p className="mt-2 text-sm font-medium text-center text-gray-700">
                {template.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

const FREE_FEATURES = [
  "Markdown editor with live preview",
  "1 template",
  "Public profile link (with OneSheet branding)",
  "1 resume",
];

const PRO_FEATURES = [
  "Everything in Free",
  "All templates",
  "PDF export",
  "Remove OneSheet branding",
  "Up to 3 resume variants",
  "Version history",
  "Profile analytics",
];

function PricingCard({
  title,
  price,
  features,
  cta,
  to,
  variant,
  badge,
}: {
  title: string;
  price: string;
  features: string[];
  cta: string;
  to: string;
  variant: "free" | "pro";
  badge?: string;
}) {
  const isPro = variant === "pro";

  return (
    <div
      className={[
        "relative rounded-lg p-6 flex flex-col gap-6",
        isPro
          ? "border-2 border-brand-500"
          : "border border-gray-200",
      ].join(" ")}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap">
          {badge}
        </span>
      )}

      <div>
        <h3 className="text-base font-semibold text-gray-950">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-950">{price}</p>
      </div>

      <ul className="flex flex-col gap-2.5 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
            <Check
              className={isPro ? "text-brand-500" : "text-gray-400"}
              size={16}
              strokeWidth={2}
              style={{ marginTop: 1, flexShrink: 0 }}
            />
            {feature}
          </li>
        ))}
      </ul>

      <Link to={to}>
        <Button
          variant={isPro ? "primary" : "secondary"}
          className="w-full"
        >
          {cta}
        </Button>
      </Link>
    </div>
  );
}

function Pricing() {
  return (
    <section className="bg-gray-50 border-y border-gray-200 py-20">
      <div className="max-w-2xl mx-auto px-6">
        <h2 className="text-2xl font-semibold text-gray-950 text-center mb-12">
          Simple pricing
        </h2>

        {/* Mobile: Pro first; Desktop: side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro card — rendered first in DOM so it appears first on mobile */}
          <div className="order-1 md:order-2 pt-4">
            <PricingCard
              title="Pro"
              price={`$${PRO_PRICE_MONTHLY}/mo`}
              features={PRO_FEATURES}
              cta="Start writing"
              to="/sign-up"
              variant="pro"
              badge="Most popular"
            />
          </div>

          {/* Free card */}
          <div className="order-2 md:order-1">
            <PricingCard
              title="Free"
              price="$0"
              features={FREE_FEATURES}
              cta="Get started"
              to="/sign-up"
              variant="free"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-950">OneSheet</span>
          <span>&mdash;</span>
          <span>&copy; {year} All rights reserved.</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/privacy" className="hover:text-gray-900 transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-gray-900 transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Landing (page)
// ---------------------------------------------------------------------------

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <TemplateShowcase />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
