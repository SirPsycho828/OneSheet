<div align="center">

<img src="public/logo.png" alt="OneSheet" width="420" />

<br />

**Markdown in. Polished resume out.**

The resume builder developers actually use.

<br />

[![Live](https://img.shields.io/badge/live-onesheet.cv-EA580C?style=for-the-badge)](https://onesheet.cv)
&nbsp;
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
&nbsp;
[![Firebase](https://img.shields.io/badge/Firebase-11-DD2C00?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com)
&nbsp;
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

<br />

---

<br />

## What is OneSheet?

OneSheet is a full-stack SaaS resume builder where you write in **Markdown** and get a pixel-perfect, **one-page PDF**. No drag-and-drop, no formatting toolbars, no clutter. Choose from 5 professionally designed templates, preview changes in real time, run your resume through AI polish, score it against a job posting, and share a public profile at `onesheet.cv/you`.

It also ships with a **REST API** so AI agents can create and manage resumes programmatically.

> **Try it** &rarr; [onesheet.cv](https://onesheet.cv)

<br />

## Features

<table>
<tr>
<td width="50%" valign="top">

### Markdown-first editor
Split-pane editor with a live-rendered preview. Write Markdown on the left, see your formatted resume on the right. Auto-saves every 1.5&nbsp;seconds.

</td>
<td width="50%" valign="top">

### One-page constraint engine
Automatic content scaling guarantees your resume fits on a single page. A real-time overflow indicator shows exactly how close you are to the edge.

</td>
</tr>
<tr>
<td valign="top">

### 5 template system
**Classic** (serif, ATS-optimized) &middot; **Modern** (color accents, pill badges) &middot; **Minimal** (maximum whitespace) &middot; **Technical** (monospace, dev-style) &middot; **Compact** (two-column, high density). All CSS-only with zero JS rendering overhead.

</td>
<td valign="top">

### Server-side PDF export
Puppeteer + headless Chromium running on Cloud Functions produces PDFs that match the preview pixel-for-pixel. US Letter and A4 supported. ATS parsers love them.

</td>
</tr>
<tr>
<td valign="top">

### AI bullet polish + job match
Paste a weak bullet and get a quantified, action-driven rewrite. Paste a job posting URL and get a match score with actionable suggestions to close the gap.

</td>
<td valign="top">

### Public profiles
Every user gets a shareable page at `onesheet.cv/{username}`. No login required to view. Renders the default resume with full template styling, optional QR code, and view analytics.

</td>
</tr>
<tr>
<td valign="top">

### Resume variants
Maintain up to 3 tailored resumes (e.g., Frontend, Backend, Startup) with independent content, templates, and analytics. One serves as the public default.

</td>
<td valign="top">

### Agent API
Full REST API with API key auth. AI agents can list, create, update, export, and publish resumes. Rate-limited and subscription-gated.

</td>
</tr>
<tr>
<td valign="top">

### Version history
Automatic snapshots on manual save, template switches, and idle intervals. Browse, preview, and restore any previous version of any resume.

</td>
<td valign="top">

### Stripe billing
Free tier with a generous feature set. Pro tier ($8/mo) unlocks all templates, PDF export, AI tools, API access, and branding removal. Powered by Stripe Checkout + Webhooks.

</td>
</tr>
</table>

<br />

## How it works

```
 +-----------+       +-----------+       +------------+
 |           |       |           |       |            |
 | Markdown  | ----> |  unified  | ----> |  Template  |
 |  (input)  |       |  pipeline |       |   (CSS)    |
 |           |       |           |       |            |
 +-----------+       +-----------+       +------------+
                          |                     |
                          v                     v
                    +---------------------------+
                    |                           |
                    |    Live Preview (DOM)      |
                    |                           |
                    +---------------------------+
                          |
                          | Export
                          v
                    +---------------------------+
                    |                           |
                    |  Puppeteer (Cloud Fn)     | ---> PDF
                    |  Headless Chromium        |
                    |                           |
                    +---------------------------+
```

The Markdown rendering pipeline uses **remark** (parse) &rarr; **remark-gfm** (tables, strikethrough) &rarr; **remark-breaks** (soft line breaks) &rarr; **remark-rehype** (to HTML AST) &rarr; **rehype-sanitize** (XSS prevention) &rarr; **rehype-stringify** (HTML string). The same pipeline runs both client-side for preview and server-side for PDF generation, ensuring exact parity.

<br />

## Tech Stack

| Layer | Tech | Why |
|---|---|---|
| **Frontend** | React 19, TypeScript, Vite 6 | React 19 compiler, instant HMR, strong types |
| **Styling** | Tailwind CSS 4 | Design tokens via `@theme`, zero-runtime CSS |
| **Backend** | Firebase Cloud Functions v2 (Express) | Serverless, auto-scales, integrated auth |
| **Database** | Cloud Firestore | Real-time sync, offline support, security rules |
| **Auth** | Firebase Auth | Email/password + Google OAuth, zero backend |
| **PDF** | Puppeteer + @sparticuz/chromium | Pixel-perfect server-side rendering |
| **Markdown** | unified (remark + rehype) | Extensible pipeline, SSR-safe |
| **AI** | OpenRouter | Model-agnostic, swap models from admin panel |
| **Billing** | Stripe Checkout + Webhooks | PCI-compliant, subscription lifecycle |
| **Hosting** | Firebase Hosting | CDN-backed, custom domain (onesheet.cv) |

<br />

## Design System: Paper & Ink

OneSheet uses a custom **Paper & Ink** design language. Editorial craft meets developer precision.

```
Palette
 ├── Primary     #292524  warm charcoal (ink)
 ├── Accent      #EA580C  terracotta (signature highlight)
 ├── Background  #FAF9F6  warm ivory (paper)
 ├── Card        #FFFFFF  bright white
 └── Muted       #F0EDE8  parchment

Typography
 ├── Headings    Fraunces (variable serif, optical sizing 9-144)
 └── Body        Public Sans (geometric sans-serif)

Resume templates bring their own fonts:
 ├── Classic     Crimson Text + Lora
 ├── Modern      Montserrat + Raleway
 ├── Minimal     Source Sans 3
 ├── Technical   JetBrains Mono
 └── Compact     Source Sans 3

Signature elements:
 ├── Ink-bleed SVG section dividers
 └── Paper dog-ear hover effect on resume cards
```

Design tokens live in `src/styles/index.css` via Tailwind v4's `@theme` block. One file, one source of truth.

<br />

## Agent API

OneSheet exposes a REST API for AI agents and automation. Authenticated via API key, rate-limited, and subscription-gated.

```bash
# List resumes
curl -H "X-Api-Key: $KEY" https://onesheet.cv/api/agent/resumes

# Create a tailored resume
curl -X POST https://onesheet.cv/api/agent/resumes \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Acme Corp", "markdown": "# Alex Chen\n..."}'

# Export to PDF
curl -X POST https://onesheet.cv/api/agent/resumes/r_3kf9x/export \
  -H "X-Api-Key: $KEY" \
  --output resume.pdf
```

Full API docs at [onesheet.cv/docs](https://onesheet.cv/docs). Agent integration guide at [onesheet.cv/agents](https://onesheet.cv/agents).

<br />

## Architecture

```
onesheet/
├── src/                              # React SPA
│   ├── components/
│   │   ├── auth/                     # PublicRoute, PrivateRoute, OAuth
│   │   ├── dashboard/                # ResumeCard, ResumeGrid, CreateModal
│   │   ├── editor/                   # MarkdownInput, PaperContainer, Preview
│   │   ├── layout/                   # AppNav, LandingNav, StatusBar
│   │   ├── profile/                  # ProfileResume, ProfileActions
│   │   ├── settings/                 # SubscriptionCard, ApiKeysCard
│   │   ├── templates/                # TemplatePicker, TemplateCard
│   │   ├── ui/                       # Button, Input, Modal, Toast, etc.
│   │   └── versions/                 # VersionPanel, VersionEntry
│   ├── config/                       # Firebase init, feature flags
│   ├── constants/                    # Templates, pricing, reserved words
│   ├── contexts/                     # AuthContext, ToastContext
│   ├── hooks/                        # useAuth, useResume, useOverflow, etc.
│   ├── lib/                          # Markdown rendering pipeline
│   ├── pages/                        # 14 route-level pages
│   ├── services/                     # Firestore CRUD, Stripe client, admin
│   ├── styles/
│   │   ├── index.css                 # Design tokens (@theme)
│   │   └── templates/                # Per-template CSS
│   └── types/                        # TypeScript interfaces
│
├── functions/                        # Firebase Cloud Functions v2
│   └── src/
│       ├── routes/
│       │   ├── agent.ts              # Agent API (CRUD + export)
│       │   ├── ai.ts                 # Bullet polish, job match, import
│       │   ├── analytics.ts          # View tracking
│       │   ├── pdf.ts                # Puppeteer PDF generation
│       │   ├── profile.ts            # Public profile data
│       │   ├── resumes.ts            # Resume CRUD
│       │   ├── stripe.ts             # Checkout, portal, webhooks
│       │   └── versions.ts           # Version history
│       ├── middleware/                # Auth verification, rate limiting
│       ├── lib/                      # Shared markdown + PDF utils
│       ├── scheduled/                # Cron: version cleanup
│       └── config.ts                 # Environment + secrets
│
├── firestore.rules                   # Per-collection security rules
├── firestore.indexes.json            # Composite query indexes
├── storage.rules                     # Storage bucket security
└── firebase.json                     # Hosting + Functions config
```

<br />

## Security

Firestore rules enforce **per-user isolation** on every collection:

- Users can only read/write their own `users/{uid}` document
- Resumes, versions, scores, and API keys are gated to the owning `userId`
- Usernames are globally readable but only creatable by auth'd users (with uniqueness check)
- Stripe customer records are read-only to the owning user, write-only via admin SDK
- Rate limits and Stripe events are admin-SDK-only (no client access)
- Admin config is gated to a specific email

All Cloud Function routes verify Firebase Auth tokens via middleware. The Agent API validates API keys against Firestore and checks subscription status before serving requests. AI and PDF routes enforce per-user rate limits.

<br />

## Getting Started

### Prerequisites

- **Node.js 22+** and **npm 10+**
- **Firebase CLI**: `npm i -g firebase-tools`
- A **Firebase project** on the Blaze plan (required for Cloud Functions)
- A **Stripe** account with a Pro product/price configured

### Install

```bash
git clone https://github.com/SirPsycho828/OneSheet.git
cd OneSheet
npm install
cd functions && npm install && cd ..
```

### Environment

```bash
cp .env.example .env.local
```

Fill in your Firebase project config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_STRIPE_PRO_PRICE_ID=
```

Set Cloud Functions secrets:

```bash
firebase functions:secrets:set STRIPE_SECRET_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set STRIPE_PRO_PRICE_ID
```

### Development

```bash
npm run dev            # Vite dev server (http://localhost:5173)
npm run test           # Run tests (Vitest)
npm run build          # Production build (tsc + Vite)
```

### Deploy

```bash
npm run build
cd functions && npm run build && cd ..
firebase deploy
```

### Post-deploy checklist

1. Enable Auth providers in Firebase Console (Email/Password, Google)
2. Initialize Storage default bucket
3. Configure Stripe webhook to point at your Cloud Function URL
4. Set all three Stripe secrets via `firebase functions:secrets:set`

<br />

## Pricing

| | **Free** | **Pro** ($8/mo) |
|:--|:--|:--|
| Markdown editor + live preview | Yes | Yes |
| Public profile page | With branding | Clean (no branding) |
| Templates | Classic | All 5 |
| Resume variants | 1 | Up to 3 |
| PDF export | &mdash; | ATS-optimized |
| AI bullet polish + job match | &mdash; | Yes |
| Version history | &mdash; | Yes |
| Custom QR code | &mdash; | Yes |
| Agent API access | &mdash; | Yes |

<br />

## License

All rights reserved.
