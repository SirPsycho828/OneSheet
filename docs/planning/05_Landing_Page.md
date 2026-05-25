## Overview

The landing page at `bragsheet.io` is the primary entry point for unauthenticated users. It communicates the product's opinionated value proposition -- one page, markdown, done -- and drives sign-up. Single scrollable page, no separate marketing site. Authenticated users hitting `/` redirect to their editor or dashboard per `01_Auth.md`.

## Dependencies

- `04_UI_Design_System.md` -- Colors, typography, component patterns
- `01_Auth.md` -- PublicRoute guard redirects signed-in users
- `08_Template_System.md` -- Template names/thumbnails for the showcase section

## Page Structure

The landing page is composed of six sections in scroll order:

```
1. Nav bar (sticky)
2. Hero
3. How It Works
4. Template Showcase
5. Pricing
6. Footer
```

No separate `/pricing` or `/features` routes at MVP. Everything lives on the single landing page with anchor links.

## Nav Bar

Sticky top bar, `h-14`, `bg-white/80 backdrop-blur-sm border-b border-gray-200`.

| Left | Center | Right |
|------|--------|-------|
| Logo + "BragSheet" wordmark | -- | "Sign in" (ghost button), "Get Started" (primary button) |

Logo: Simple monogram or wordmark. No icon-heavy logo -- typography-forward to match the product philosophy. Use Inter 600 weight, `text-lg`.

On mobile (`< md`): hide "Sign in" text, show only "Get Started" button. Sign-in accessible from the get-started flow.

## Hero Section

The hero makes the constraint proposition immediately clear. No ambiguity about what the product does.

**Layout**: Two columns on desktop, stacked on mobile.

**Left column (copy)**:
- Headline: "One page. Markdown. Done." -- `text-4xl` / `text-5xl` on desktop, Inter 600
- Subheadline: "Write your resume in Markdown. Pick a template. Get a pixel-perfect PDF and a shareable link. No fluff, no 50-template paralysis, no multi-page sprawl." -- `text-lg text-gray-700`, max 2-3 sentences
- Primary CTA: "Start writing" -- primary button, large variant (`h-11 px-6 text-base`), links to `/sign-up`
- Secondary line below CTA: "Free to use. PDF export on paid plan." -- `text-sm text-gray-500`

**Right column (visual)**:
- A static screenshot or stylized preview showing the split editor: markdown on the left, rendered resume on the right
- The preview should show realistic resume content, not lorem ipsum
- Sits inside a browser chrome mockup (minimal -- just the three dots and an address bar showing `bragsheet.io/jane`)
- Subtle `shadow-xl rounded-lg` treatment

No autoplay video. No animation on the preview. Static image loads faster and communicates instantly.

## How It Works

Three-step horizontal layout on desktop, vertical stack on mobile.

**Section heading**: "How it works" -- centered, `text-2xl font-semibold`

| Step | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | `Code` | Write in Markdown | "Your resume content in a format you already know. No drag-and-drop, no formatting toolbar. Just text." |
| 2 | `Layout` | Pick a template | "Choose from a handful of focused templates. Each one is designed for one page, period." |
| 3 | `Download` | Export or share | "Download a pixel-perfect PDF or share your public link: bragsheet.io/you" |

Each step is a card with the Lucide icon (48px, `text-brand-500`), title in `text-base font-semibold`, description in `text-sm text-gray-700`. Cards are `text-center` with `gap-8` between them.

No numbered circles or step connectors. The visual simplicity mirrors the product philosophy.

## Template Showcase

Shows the 3-5 available templates with visual previews.

**Section heading**: "Templates that respect the one-page rule" -- centered

**Layout**: Horizontal scroll on mobile, grid on desktop (`grid-cols-3` or `grid-cols-5` depending on count).

Each template card:
- Thumbnail image of a rendered resume using that template (static image, not live render)
- Template name below: `text-sm font-medium`
- Card: `bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow`
- Aspect ratio matches US Letter paper (1 : 1.294)

No "click to preview" interaction on the landing page. The thumbnails are sufficient to communicate variety. Full interactive preview is post-auth in the template picker (see `08_Template_System.md`).

## Pricing

Two-column layout: Free and Pro side by side, centered. Max width `max-w-2xl`.

**Section heading**: "Simple pricing" -- centered

### Free Tier

- Card with `border border-gray-200`
- Title: "Free"
- Price: "$0"
- Features list (checkmarks in `text-gray-500`):
  - Markdown editor with live preview
  - 1 template
  - Public profile link (with BragSheet branding)
  - 1 resume
- CTA: "Get started" -- secondary button, links to `/sign-up`

### Pro Tier

- Card with `border-2 border-brand-500` and a small "Most popular" badge (`bg-brand-50 text-brand-700 text-xs font-medium px-2 py-0.5 rounded-full`) above the card or top-right
- Title: "Pro"
- Price: "$8/mo" [default -- PRD said "$8-12/mo", use lower end]
- Features list (checkmarks in `text-brand-500`):
  - Everything in Free
  - All templates
  - PDF export
  - Remove BragSheet branding
  - Up to 3 resume variants
  - Version history
  - Profile analytics
- CTA: "Start writing" -- primary button, links to `/sign-up`

No annual pricing toggle at MVP. Single monthly plan.

See `14_Stripe_Billing.md` for billing implementation. The landing page only displays pricing; checkout happens post-auth.

## Footer

Minimal footer, `bg-gray-50 border-t border-gray-200`, `py-8`.

**Layout**: Single row on desktop, stacked on mobile.

| Left | Right |
|------|-------|
| "BragSheet" wordmark + `text-sm text-gray-500` copyright | Links: Privacy, Terms, GitHub (icon link to repo if open-source) |

No newsletter signup, no social media links, no sitemap columns. Keep it minimal.

Privacy and Terms pages can be simple markdown-rendered pages at `/privacy` and `/terms`. Content is boilerplate at MVP -- standard SaaS privacy policy and terms of service.

## SEO and Meta

```
<title>BragSheet -- One-page resume builder for developers</title>
<meta name="description" content="Write your resume in Markdown. Pick a template. Export a pixel-perfect one-page PDF or share a public link. No fluff.">
```

OpenGraph tags for social sharing:
- `og:title`: "BragSheet -- One-page resume builder"
- `og:description`: Same as meta description
- `og:image`: Static image of the editor preview (same asset as hero section)
- `og:url`: `https://bragsheet.io`
- `twitter:card`: `summary_large_image`

## Performance Targets

- Largest Contentful Paint: < 2.5s (hero image is the LCP element -- optimize as WebP, lazy-load below-fold images)
- No JavaScript required for initial paint (SSR or prerender the landing page if possible; otherwise ensure critical CSS is inlined)
- Template thumbnails: lazy-loaded with `loading="lazy"`, compressed WebP, max 80KB each
- Total landing page weight: < 500KB excluding fonts

## Mobile Behavior

- Nav bar collapses to logo + single "Get Started" button
- Hero stacks vertically (copy above, preview below -- preview may be hidden on very small screens)
- How It Works stacks vertically
- Template showcase becomes horizontal scroll with snap points
- Pricing cards stack vertically (Pro card first on mobile since it's the primary conversion target)
- Footer stacks vertically

All sections use standard Tailwind responsive prefixes. No hamburger menu -- there aren't enough nav items to warrant one.

## Gaps & Assumptions

- **Hero image asset**: Requires a polished screenshot of the editor with realistic resume content. This needs to be created once the editor is functional. Use a placeholder gray rectangle during initial development.
- **Template thumbnails**: Same dependency -- need rendered template previews as static images. Generate these from actual templates once `08_Template_System.md` is implemented.
- **Copy tone**: Headlines and descriptions above are functional drafts. May benefit from a copywriting pass before launch, but are implementable as-is.
- **Pricing amount**: Using $8/mo as the default. PRD specified a range of $8-12/mo. Final amount set in Stripe dashboard and can be changed without code updates. The landing page should read the price from a constant, not hard-code it.
- **Legal pages**: Privacy policy and Terms of Service need actual legal content. Use a generator (e.g., Termly, iubenda) for MVP-quality legal text. Do not ship without these pages.
- **Analytics/tracking**: No analytics on the landing page at MVP. If conversion tracking is needed later, add Plausible or simple Firestore event logging. Avoid Google Analytics (privacy concerns for the target audience).  
