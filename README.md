<div align="center">

# BragSheet

**Markdown-powered one-page resumes with live preview, PDF export, and public profiles.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-11-DD2C00?logo=firebase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Billing-635BFF?logo=stripe&logoColor=white)

</div>

---

## Overview

BragSheet is a SaaS resume builder where you write in Markdown and get a pixel-perfect one-page resume. Choose from 5 professionally designed templates, preview changes in real-time, export to PDF, and share a public profile link — all from a clean, distraction-free editor.

## Features

<table>
<tr>
<td width="50%">

**Markdown Editor**
Split-pane editor with live preview. Write in Markdown, see your formatted resume instantly. Auto-saves every 1.5 seconds.

</td>
<td width="50%">

**One-Page Constraint**
Automatic content scaling ensures your resume always fits on one page. Visual overflow warnings guide you to trim content.

</td>
</tr>
<tr>
<td>

**5 Templates**
Classic (serif), Modern (blue accents), Minimal (tight spacing), Technical (monospace), and Compact (two-column). CSS-only — no JavaScript rendering overhead.

</td>
<td>

**PDF Export**
Server-side Puppeteer rendering produces pixel-perfect PDFs matching the preview. US Letter and A4 paper sizes supported.

</td>
</tr>
<tr>
<td>

**Public Profiles**
Every user gets a shareable URL at `bragsheet.io/{username}`. No login required to view. Renders the default resume with full template styling.

</td>
<td>

**Version History**
Automatic snapshots on manual save, template switches, and idle intervals. Browse, preview, and restore any previous version.

</td>
</tr>
<tr>
<td>

**Resume Variants**
Maintain up to 3 tailored resumes (Frontend, Backend, Startup) with independent content, templates, and analytics. One serves as the public default.

</td>
<td>

**Agent API**
REST API with API key auth for AI agents. Create, update, export, and manage resumes programmatically. Rate-limited and subscription-gated.

</td>
</tr>
</table>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | Tailwind CSS 4 |
| Backend | Firebase Cloud Functions v2 (Express) |
| Database | Cloud Firestore |
| Auth | Firebase Auth (Email, Google, GitHub) |
| PDF | Puppeteer + @sparticuz/chromium |
| Markdown | unified (remark + rehype) |
| Billing | Stripe Checkout + Webhooks |
| Hosting | Firebase Hosting |
| Icons | Lucide React |
| Fonts | Inter, JetBrains Mono, Crimson Text |

## Architecture

```
bragsheet/
├── src/                          # React SPA
│   ├── components/
│   │   ├── auth/                 # PublicRoute, PrivateRoute, OAuth
│   │   ├── dashboard/            # ResumeCard, ResumeGrid, CreateModal
│   │   ├── editor/               # MarkdownInput, PaperContainer, Preview
│   │   ├── layout/               # AppNav, StatusBar
│   │   ├── profile/              # ProfileResume, ProfileActions
│   │   ├── settings/             # SubscriptionCard, ApiKeysCard
│   │   ├── templates/            # TemplatePicker, TemplateCard
│   │   ├── ui/                   # Button, Input, Modal, Toast, etc.
│   │   └── versions/             # VersionPanel, VersionEntry
│   ├── contexts/                 # AuthContext, ToastContext
│   ├── hooks/                    # useAuth, useResume, useOverflow, etc.
│   ├── services/                 # Firestore CRUD, Stripe client
│   ├── lib/                      # Markdown rendering pipeline
│   ├── types/                    # TypeScript interfaces
│   ├── constants/                # Templates, pricing, reserved words
│   ├── styles/templates/         # 5 template CSS files + base
│   └── pages/                    # Landing, Editor, Dashboard, Settings, etc.
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       ├── routes/               # pdf, profile, resumes, versions, stripe, analytics, agent
│       ├── middleware/            # auth, rateLimit
│       ├── lib/                  # markdown, pdf
│       ├── scheduled/            # cleanupVersions
│       └── config.ts             # Stripe secrets
├── firestore.rules               # Security rules
├── firestore.indexes.json        # Composite indexes
├── storage.rules                 # Storage security rules
└── firebase.json                 # Hosting + Functions config
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase CLI (`npm i -g firebase-tools`)
- A Firebase project on the Blaze plan (for Cloud Functions)

### Install

```bash
git clone <repo-url> bragsheet
cd bragsheet
npm install
cd functions && npm install && cd ..
```

### Environment Setup

Copy the example env file and fill in your Firebase project config:

```bash
cp .env.example .env.local
```

Required variables:

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
npm run dev          # Start Vite dev server
npm run test         # Run tests
npm run test:watch   # Watch mode
npm run build        # Production build
```

### Deploy

```bash
npm run build
cd functions && npm run build && cd ..
firebase deploy
```

## Manual Setup Steps

After deploying, complete these steps in the Firebase Console:

1. **Enable Auth providers**: Email/Password, Google, GitHub
2. **Enable Storage**: Initialize default bucket in the Firebase Console
3. **Upgrade to Blaze plan**: Required for Cloud Functions deployment
4. **Configure Stripe**: Create a Pro product/price, set up webhook endpoint pointing to your Cloud Function URL
5. **Set Stripe secrets**: Use `firebase functions:secrets:set` for all three Stripe keys

## Pricing

| | Free | Pro ($8/mo) |
|--|------|------------|
| Markdown editor | Yes | Yes |
| Live preview | Yes | Yes |
| Public profile | With branding | Clean |
| Templates | Classic only | All 5 |
| PDF export | No | Yes |
| Resume variants | 1 | Up to 3 |
| Version history | No | Yes |
| Profile analytics | No | Yes |
| Agent API | No | Yes |

## License

Private. All rights reserved.
