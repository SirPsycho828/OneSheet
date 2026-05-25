## Overview

This file catalogs features explicitly deferred from BragSheet's MVP. Each item was considered during PRD development and intentionally scoped out -- not forgotten. Items are grouped by domain, prioritized by user impact, and annotated with implementation complexity to inform roadmap planning. Nothing here is committed; this is a backlog, not a promise.

## Dependencies

- All preceding PRD files -- each "Gaps & Assumptions" section references deferrals documented here
- `14_Stripe_Billing.md` -- Tier structure may expand to accommodate new features
- `02_Database_Schema.md` -- Many features require schema additions

## Prioritization Key

| Priority | Meaning |
|----------|---------|
| P1 | High user demand, builds on MVP infrastructure, implement in first post-launch cycle |
| P2 | Medium demand, meaningful differentiation, second cycle |
| P3 | Nice-to-have, significant effort, revisit based on traction |

## Editor & Content

### Custom Sections / Block Types (P2)

Structured blocks beyond free-form markdown: skill bars, project cards, certification badges, timeline entries. Users select a block type, fill in fields, and it renders with template-aware styling.

- Requires: block schema definition, per-template block renderers, editor UI for inserting/editing blocks
- Complexity: High (touches editor, preview, templates, PDF export, and storage)
- Alternative: users achieve similar results with markdown tables and headings today

### AI-Assisted Writing (P1)

"Improve this bullet" or "Make this more quantitative" inline suggestions powered by Claude API. User highlights text, clicks "Improve," receives a suggestion they accept or reject.

- Requires: Claude API integration in Cloud Functions, prompt engineering, UI for inline suggestions
- Complexity: Medium (API call + UI, no schema changes)
- Billing: could be free for Pro users (cost absorbed) or metered (X improvements per month)

### Import from LinkedIn (P1)

Paste a LinkedIn profile URL or upload a LinkedIn data export (PDF/JSON). System extracts structured data and generates initial markdown.

- Requires: LinkedIn PDF parsing (or JSON export parsing), markdown generation heuristics
- Complexity: Medium (parsing logic is the challenge; no ongoing API integration since LinkedIn's API requires partner access)
- Risk: LinkedIn PDF format changes without notice

### Import from Existing Resume (P1)

Upload a PDF or DOCX resume. System extracts text and converts to markdown.

- Requires: PDF text extraction (pdf-parse or similar), DOCX parsing, heuristic markdown structuring
- Complexity: Medium (extraction is imperfect; formatting loss is expected)
- User expectation management: "Import gives you a starting point, not a perfect conversion"

### Spell Check / Grammar (P3)

Beyond the browser's built-in spell check. Integrated grammar suggestions (Grammarly-style).

- Requires: third-party API (LanguageTool, Sapling, or custom Claude integration)
- Complexity: Low-Medium (API integration + UI for suggestions)
- Defer reason: browser spell check covers 80% of the need at zero cost

## Templates & Design

### Custom Templates (P2)

Users create their own templates by writing CSS or using a visual template editor.

- Requires: template authoring UI, CSS sandboxing (prevent breaking the app shell), template storage per user
- Complexity: High (CSS editor + sandbox + preview + PDF compatibility)
- Alternative: offer 10-15 pre-built templates instead of a full editor

### Template Marketplace (P3)

Community-contributed templates. Designers upload templates, users browse and install them.

- Requires: submission workflow, review/moderation, template packaging format, discovery UI
- Complexity: Very high (marketplace is a product in itself)
- Prerequisite: custom template infrastructure must exist first

### Additional Pre-Built Templates (P1)

Expand from 5 to 10-15 templates. No new infrastructure needed -- just design work.

- Requires: design time, template CSS/HTML authoring, PDF render testing per template
- Complexity: Low (repeatable process established by MVP's 5 templates)
- Candidates: "Creative" (portfolio-style), "Executive" (conservative serif), "Academic" (CV format), "Two-column" (sidebar layout)

### Dark Mode (P2)

App-wide dark mode toggle for the editor and dashboard. Public profiles remain light (recruiter-facing, print-friendly).

- Requires: Tailwind `dark:` variants throughout, theme toggle in settings, persist preference
- Complexity: Medium (systematic but tedious across all components)
- Note: does NOT affect PDF export or public profile rendering

## Public Profile & Sharing

### Custom Domains (P2)

Users point their own domain (e.g., `resume.janedoe.com`) to their BragSheet profile.

- Requires: DNS verification flow, SSL certificate provisioning (Firebase Hosting supports this), domain-to-user mapping in Firestore
- Complexity: Medium (Firebase Hosting custom domains are well-documented, but UX for DNS setup is tricky)
- Billing: could be a "Pro+" feature or included in Pro

### QR Code Generator (P1)

Generate a QR code for the public profile URL. Downloadable as PNG/SVG for printing on business cards.

- Requires: QR code library (client-side generation), download button
- Complexity: Low (purely client-side, no backend changes)

### Profile Photo / Avatar (P2)

Upload a photo displayed on the public profile and in templates that support it.

- Requires: Firebase Storage for image upload, image processing (resize, crop), template-level photo placement
- Complexity: Medium (upload + crop UI + storage rules + template integration)

### SEO Optimization (P2)

Enhanced meta tags, structured data (JSON-LD for Person/Resume), sitemap generation for public profiles.

- Requires: server-side rendering of meta tags (already needed for social cards), JSON-LD schema, automated sitemap
- Complexity: Low-Medium (meta tags are quick; sitemap at scale needs automation)

### Social Preview Cards (P1)

When a BragSheet link is shared on LinkedIn/Twitter/Slack, show a rich preview card (name, title, template thumbnail).

- Requires: Open Graph + Twitter Card meta tags served by the public profile endpoint, dynamic OG image generation (or static fallback)
- Complexity: Low for basic meta tags, Medium for dynamic OG images (requires image generation service)

## Analytics & Insights

### Time-Series Analytics (P2)

Views per day/week/month chart. "Your profile got 45 views this week, up 20% from last week."

- Requires: daily rollup documents in Firestore (or a time-series subcollection), chart library on dashboard, scheduled function for rollups
- Complexity: Medium (data model change + scheduled function + charting UI)
- See `15_Profile_Analytics.md` gaps section

### Referrer Tracking (P2)

Where profile visitors come from: LinkedIn, direct, email, other.

- Requires: capture `Referer` header on profile view, store per-view or aggregate by source, display breakdown on dashboard
- Complexity: Medium (privacy considerations, header may be stripped by browsers)

### Geographic Data (P3)

Country/region of profile visitors from IP geolocation.

- Requires: IP-to-geo lookup service, aggregate storage, map or table visualization
- Complexity: Medium (third-party service dependency, privacy/GDPR considerations)

## Billing & Monetization

### Annual Billing (P1)

$72/year ($6/month equivalent) alongside the $8/month option. Standard SaaS discount for annual commitment.

- Requires: additional Stripe Price object, UI for plan selection during checkout, handle mid-cycle switches
- Complexity: Low (Stripe handles the billing mechanics; UI change is minor)

### Team Plan (P3)

Organization-level billing. Admin manages multiple users' subscriptions under one invoice.

- Requires: org/team data model, admin dashboard, seat management, consolidated billing via Stripe
- Complexity: Very high (multi-tenant is a major architectural shift)

### Free Trial (P2)

7-day Pro trial for new signups. No credit card required. Converts to free tier if not upgraded.

- Requires: `trialEndsAt` field on user, scheduled function to expire trials, UI countdown
- Complexity: Low (Stripe supports `trial_period_days` natively)

## Agent & API

### X402 / Machine Payment Protocol (P3)

Agents pay per-action using X402 protocol headers instead of API keys tied to a human's subscription.

- Requires: X402 protocol implementation, per-action pricing model, payment verification middleware
- Complexity: High (protocol is emerging, limited ecosystem tooling)
- See `16_Agent_API.md` gaps section

### Webhook Notifications (P2)

Agents register webhook URLs to receive events (profile viewed, resume updated).

- Requires: webhook registration API, event dispatch system, retry logic for failed deliveries, webhook management UI
- Complexity: Medium (standard webhook infrastructure)

### Scoped API Keys (P2)

API keys with limited permissions (read-only, single-resume, no export).

- Requires: permission model on API key documents, middleware checks per endpoint
- Complexity: Low-Medium (permission checking is straightforward)

## Platform & Infrastructure

### PWA / Offline Mode (P3)

Service worker for offline editor access. Changes sync when reconnection occurs.

- Requires: service worker, IndexedDB for offline storage, sync queue, conflict resolution for offline edits
- Complexity: Very high (offline-first is architecturally complex; conflict resolution across extended offline periods is hard)
- See `18_Error_Handling_Saves.md` -- current approach uses localStorage backup, not full offline

### Email Notifications (P2)

Weekly digest: "Your profile got X views this week." Milestone alerts: "You hit 100 profile views!"

- Requires: email service (SendGrid/Postmark), notification preferences, scheduled function for digests, email templates
- Complexity: Medium (email infrastructure + preference management)

### Multi-Language Support (P3)

UI in multiple languages. Resume content is already user-controlled (they write in any language), but app chrome (buttons, labels, nav) would be translated.

- Requires: i18n library (react-i18next or similar), translation files, language picker
- Complexity: Medium (systematic string extraction + ongoing translation maintenance)

### Collaborative Editing (P3)

Multiple users edit the same resume simultaneously (Google Docs-style).

- Requires: CRDT or OT implementation, real-time sync (Firestore realtime or WebSocket), presence indicators, cursor sharing
- Complexity: Extremely high (fundamentally different architecture from single-user auto-save)
- Unlikely to be relevant for personal resumes; more applicable if Team plan exists

## Gaps & Assumptions

- **Prioritization is subjective**: P1/P2/P3 ratings reflect the PRD author's judgment based on user impact and implementation cost. Actual priority should be validated against user feedback, usage data, and business goals post-launch.
- **Complexity estimates are rough**: "Low/Medium/High" without time estimates. Actual effort depends on team size, familiarity with the codebase, and third-party service evaluation. Each P1 item should receive its own design spike before committing to a timeline.
- **No feature interdependencies mapped**: Some items enable others (custom templates → template marketplace, time-series analytics → email digests with data). Implementation order matters but isn't specified here. Build a dependency graph during roadmap planning.
- **Billing implications**: Several features (custom domains, AI writing, team plans) may warrant new pricing tiers. The current two-tier model (free/Pro) may evolve to three or four tiers. Pricing strategy is a business decision outside this technical spec.
- **This list is not exhaustive**: Users will request features not listed here. This document captures only items that were actively considered and deferred during MVP planning. New ideas should be evaluated against the same prioritization criteria.  
