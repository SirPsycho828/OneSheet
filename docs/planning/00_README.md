▸ Extended thinking (326 chars)  
## Overview

BragSheet is a markdown-based resume builder that enforces a strict one-page constraint. Users write resume content in Markdown, choose from 3-5 focused templates, preview on real paper dimensions, and export as a polished one-page PDF or a clean public link at `bragsheet.io/{name}`. The product supports both human users and AI agents through a unified system with two interfaces.

The core product wedge is opinionated constraint: one page, markdown input, no template bloat. Target audience is developers and technical professionals who prefer plaintext workflows.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React + TypeScript | SPA with Vite |
| Styling | Tailwind CSS | Design system in `04_UI_Design_System.md` |
| Auth | Firebase Auth | Email/password primary, GitHub + Google OAuth |
| Database | Cloud Firestore | Collections in `02_Database_Schema.md` |
| Storage | Firebase Storage | Profile photos only |
| Hosting | Firebase Hosting | Serves app + public profiles |
| Functions | Cloud Functions (Node.js) | PDF rendering, agent API |
| PDF | Puppeteer (server-side) | Runs in Cloud Functions |
| Markdown | remark (remark-gfm, remark-breaks) | Parses user input to AST, rendered to HTML |
| Payments | Stripe | Freemium model, see `14_Stripe_Billing.md` |
| Email | Resend | Transactional emails (verification, etc.) |

## File Structure

| File | Description |
|------|-------------|
| `00_README.md` | This file. Project overview, tech stack, file index |
| `01_Auth.md` | Email/password + GitHub/Google OAuth, session handling |
| `02_Database_Schema.md` | Firestore collections, field definitions, indexes |
| `03_API_Endpoints.md` | REST endpoints for Cloud Functions |
| `04_UI_Design_System.md` | Colors, typography, component patterns, design tokens |
| `05_Landing_Page.md` | Marketing page, hero, feature showcase, CTA |
| `06_Markdown_Editor.md` | Core editor with live preview on paper dimensions |
| `07_One_Page_Constraint.md` | Overflow detection, auto-scale, warning system |
| `08_Template_System.md` | Template definitions, picker UI, switching behavior |
| `09_PDF_Export.md` | Server-side rendering, paid gate, download flow |
| `10_Public_Profiles.md` | `bragsheet.io/{name}` rendered pages, SEO, sharing |
| `11_Dashboard.md` | Resume management for multi-variant users |
| `12_Resume_Variants.md` | Named resume versions for different job types |
| `13_Version_History.md` | Auto-save snapshots, browse and restore |
| `14_Stripe_Billing.md` | Free/paid tiers, checkout, subscription management |
| `15_Profile_Analytics.md` | View counts, PDF download tracking |
| `16_Agent_API.md` | API interface for AI agents, same system as human UI |
| `17_Mobile_Experience.md` | Simplified view, quick-edit, responsive behavior |
| `18_Error_Handling_Saves.md` | Optimistic saves, offline support, toast notifications |
| `19_Future_Features.md` | Deferred items: AI suggestions, custom domains, X402/MPP |

## Build Sequence

The file numbering reflects implementation order. The recommended build phases:

**Phase A -- Foundation (files 00-04)**
Auth, database, API structure, and design system. Everything else depends on these.

**Phase B -- Core Editor (files 05-08)**
Landing page, markdown editor with live preview, one-page constraint enforcement, and template system. This is the core product loop: write markdown, see it rendered on a page.

**Phase C -- Output (files 09-10)**
PDF export and public profiles. These are the two ways a resume leaves BragSheet.

**Phase D -- Management (files 11-13)**
Dashboard, resume variants, and version history. These support users who return and iterate.

**Phase E -- Monetization (files 14-15)**
Stripe billing and profile analytics. Gate PDF export behind paid tier.

**Phase F -- Extension (files 16-18)**
Agent API, mobile experience, and error handling refinements. These round out the MVP.

## MVP Scope

**In scope (Phase 1-2 from vision):**
- Markdown editor with live preview on US Letter / A4 dimensions
- 3-5 clean templates with deliberate template picker step
- One-page constraint: visual warning + auto-scale font to fit
- Server-side PDF export (paid gate)
- Public profile at `bragsheet.io/{name}` (rendered resume only, no raw markdown)
- Email/password auth + GitHub and Google OAuth
- 2-3 named resume variants per user
- Auto-save with version history (periodic Firestore snapshots)
- Freemium Stripe billing
- Simple Firestore counters for profile views and PDF downloads
- Agent-compatible API (same system, API interface)
- Mobile: simplified view with quick-edit for typos, serious editing desktop-only

**Explicitly deferred (see `19_Future_Features.md`):**
- AI content suggestions and ATS score checker (Phase 3)
- X402/MPP payment protocol support (Phase 3)
- Custom domain support for public profiles
- University/team bulk licensing
- Cover letter generator
- Job application tracker
- LinkedIn import
- Integrations marketplace

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth primary method | Email/password | Broadest appeal; OAuth as secondary options |
| PDF rendering | Server-side Puppeteer | Pixel-perfect output, consistent across browsers |
| Public profile content | Rendered resume only | Clean, purposeful -- no raw markdown exposed |
| Paid gate | PDF export | Clear value exchange; free users still get public link |
| Free tier branding | "Create yours" link on public profile | Non-intrusive; paid removes it |
| Post-auth landing | Dashboard only for multi-variant users | Single-resume users go straight to editor |
| Template selection | Deliberate step before editing | User browses 3-5 options with live preview |
| Mobile strategy | Simplified view + quick-edit | Full editing is desktop; mobile handles typo fixes |
| Error handling | Optimistic saves + toast notifications | Content never lost; user informed of system status |
| ATS feedback | Optional readability hints | Helpful but not pushy; not a scoring system |
| Version control | Auto-save with browsable history | Periodic snapshots to Firestore at MVP |
| Resume variants | 2-3 named variants at MVP | Separate Firestore documents per variant |
| Analytics | Simple Firestore counters | Profile views + PDF downloads; no third-party analytics |
| Photos | Firebase Storage | Optional profile photo upload |
| Custom domains | Deferred post-MVP | Adds DNS complexity; `bragsheet.io/{name}` suffices for MVP |

## Key Gaps

These gaps are flagged across the individual files. The most impactful ones:

1. **Paper size handling** -- PRD mentions "real paper dimensions" but doesn't specify whether to support US Letter only or also A4. Default: support both with a toggle, US Letter as default. See `06_Markdown_Editor.md`.

2. **Template design specifications** -- PRD says "3-5 clean templates" but doesn't define them. Defaults proposed in `08_Template_System.md`.

3. **Auto-scale limits** -- One-page constraint uses auto-scale, but minimum readable font size isn't specified. Default: floor at 9pt. See `07_One_Page_Constraint.md`.

4. **Version history retention** -- How many snapshots to keep per resume isn't defined. Default: last 50 versions. See `13_Version_History.md`.

5. **Agent API authentication** -- PRD says agents can use BragSheet "entirely by themselves" but doesn't specify agent auth mechanism. Default: API keys issued per user account. See `16_Agent_API.md`.

6. **Username/slug rules** -- Public profiles use `bragsheet.io/{name}` but validation rules for the slug aren't specified. Default: 3-30 chars, alphanumeric + hyphens, unique. See `10_Public_Profiles.md`.

7. **Free tier limits on variants** -- PRD says 2-3 variants at MVP but doesn't clarify if free users get variants. Default: free users get 1 resume, paid get up to 3. See `12_Resume_Variants.md`.

## Gaps & Assumptions

- **Hosting region**: Assumed `us-central1` for Cloud Functions. Adjust if user base is primarily non-US.
- **Puppeteer in Cloud Functions**: Requires 1GB+ memory allocation. Budget for higher-tier function instances for PDF generation.
- **Resend for email**: Assumed transactional-only at MVP (verification emails, password reset). No marketing emails.
- **No SSR for public profiles at MVP**: Public profiles are served as client-rendered pages. If SEO becomes critical, SSR can be added later via Cloud Functions.
- **Stripe pricing**: Specific price points ($8-12/mo) will be finalized during Stripe integration. Files reference "paid tier" generically.  
