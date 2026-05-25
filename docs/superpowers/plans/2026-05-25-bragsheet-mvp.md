# BragSheet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build BragSheet — a markdown-based one-page resume builder with live preview, PDF export, public profiles, Stripe billing, and an agent API.

**Architecture:** React SPA (Vite + TypeScript) with Tailwind CSS. Firebase backend (Auth, Firestore, Cloud Functions, Hosting, Storage). Server-side PDF via Puppeteer in Cloud Functions. Stripe for billing. Shared markdown rendering pipeline (remark) between client and server.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, Firebase (Auth, Firestore, Functions, Hosting, Storage), remark/rehype, Puppeteer (via @sparticuz/chromium), Stripe, Lucide React icons, Inter + JetBrains Mono + Crimson Text fonts.

**PRD Reference:** All specs live in `docs/planning/00_README.md` through `19_Future_Features.md`. Each task references the PRD file(s) it implements. Subagents MUST read the referenced PRD file(s) before implementing.

---

## File Structure

```
bragsheet/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .env.example
├── .env.local                    # Firebase + Stripe keys (gitignored)
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx                  # App entry, React root
│   ├── App.tsx                   # Router + AuthProvider + ToastProvider
│   ├── vite-env.d.ts
│   ├── config/
│   │   └── firebase.ts           # Firebase app init, getAuth, getFirestore
│   ├── constants/
│   │   ├── templates.ts          # Template metadata (id, name, font)
│   │   ├── pricing.ts            # Pricing constants ($8/mo)
│   │   └── reserved-words.ts     # Reserved usernames
│   ├── types/
│   │   ├── user.ts               # User, Subscription types
│   │   ├── resume.ts             # Resume, Overflow, Version types
│   │   ├── analytics.ts          # Analytics type
│   │   └── api.ts                # API error response types
│   ├── hooks/
│   │   ├── useAuth.ts            # Auth state hook (4 states)
│   │   ├── useResume.ts          # Resume CRUD + auto-save
│   │   ├── useOverflow.ts        # Overflow detection + scale
│   │   ├── useToast.ts           # Toast notification hook
│   │   ├── useDebounce.ts        # Debounce utility hook
│   │   └── useOnlineStatus.ts    # Online/offline detection
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Auth provider + state machine
│   │   └── ToastContext.tsx       # Toast provider + queue
│   ├── services/
│   │   ├── auth.ts               # signUp, signIn, signOut, OAuth
│   │   ├── resumes.ts            # Firestore CRUD for resumes
│   │   ├── versions.ts           # Version snapshot CRUD
│   │   ├── analytics.ts          # Analytics reads
│   │   ├── usernames.ts          # Username check + claim
│   │   ├── stripe.ts             # Checkout + portal session creation
│   │   └── api.ts                # API client (fetch wrapper with auth)
│   ├── lib/
│   │   └── markdown.ts           # Shared remark pipeline (md -> HTML)
│   ├── components/
│   │   ├── ui/                   # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── OverflowMenu.tsx
│   │   ├── layout/
│   │   │   ├── AppNav.tsx         # Editor/dashboard nav bar
│   │   │   ├── LandingNav.tsx     # Landing page nav
│   │   │   └── StatusBar.tsx      # Editor status bar
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   ├── OAuthButtons.tsx
│   │   │   ├── PublicRoute.tsx
│   │   │   ├── PrivateRoute.tsx
│   │   │   └── OnboardingRoute.tsx
│   │   ├── editor/
│   │   │   ├── MarkdownInput.tsx  # Textarea with keyboard shortcuts
│   │   │   ├── ResumePreview.tsx  # Paper container + rendered HTML
│   │   │   ├── PaperContainer.tsx # Paper-sized wrapper with scaling
│   │   │   ├── OverflowWarning.tsx
│   │   │   ├── EditorLayout.tsx   # Split panel (desktop) / tabs (mobile)
│   │   │   └── MeasureContainer.tsx # Off-screen measurement div
│   │   ├── templates/
│   │   │   ├── TemplatePicker.tsx # Full-screen overlay picker
│   │   │   └── TemplateCard.tsx   # Individual template preview card
│   │   ├── dashboard/
│   │   │   ├── ResumeCard.tsx
│   │   │   ├── ResumeGrid.tsx
│   │   │   ├── CreateResumeModal.tsx
│   │   │   └── SortDropdown.tsx
│   │   ├── versions/
│   │   │   ├── VersionPanel.tsx   # Slide-over panel
│   │   │   └── VersionEntry.tsx
│   │   ├── settings/
│   │   │   ├── SubscriptionCard.tsx
│   │   │   ├── ApiKeyList.tsx
│   │   │   └── ApiKeyDialog.tsx
│   │   └── profile/
│   │       ├── ProfileResume.tsx  # Public profile resume display
│   │       └── ProfileActions.tsx # Copy link, download PDF buttons
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── SignIn.tsx
│   │   ├── SignUp.tsx
│   │   ├── Onboarding.tsx
│   │   ├── VerifyEmail.tsx
│   │   ├── Editor.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   ├── PublicProfile.tsx
│   │   ├── Privacy.tsx
│   │   ├── Terms.tsx
│   │   └── NotFound.tsx
│   └── styles/
│       ├── index.css              # Tailwind directives + font imports
│       └── templates/
│           ├── base.css           # Shared resume styles
│           ├── classic.css
│           ├── modern.css
│           ├── minimal.css
│           ├── technical.css
│           └── compact.css
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              # Export all functions
│   │   ├── config.ts             # Stripe keys, env vars
│   │   ├── middleware/
│   │   │   ├── auth.ts           # Bearer token + API key verification
│   │   │   └── rateLimit.ts      # Rate limiting for agent API
│   │   ├── lib/
│   │   │   ├── markdown.ts       # Same remark pipeline as client
│   │   │   └── pdf.ts            # Puppeteer PDF generation
│   │   ├── routes/
│   │   │   ├── pdf.ts            # POST /api/pdf/generate
│   │   │   ├── profile.ts        # GET /api/profile/:username, /meta
│   │   │   ├── stripe.ts         # Webhook, checkout, portal
│   │   │   ├── username.ts       # GET /api/username/check/:username
│   │   │   ├── analytics.ts      # GET /api/analytics/:resumeId
│   │   │   ├── versions.ts       # GET/POST versions, restore
│   │   │   ├── resumes.ts        # POST create, POST set-default, DELETE
│   │   │   └── agent.ts          # Agent CRUD endpoints
│   │   └── scheduled/
│   │       └── cleanupVersions.ts # Daily version retention cleanup
│   └── fonts/                     # Bundled woff2 for PDF rendering
│       ├── inter-*.woff2
│       ├── crimson-text-*.woff2
│       └── jetbrains-mono-*.woff2
└── tests/
    ├── setup.ts
    ├── lib/
    │   └── markdown.test.ts
    ├── hooks/
    │   ├── useAuth.test.ts
    │   └── useOverflow.test.ts
    ├── components/
    │   ├── auth/
    │   │   └── route-guards.test.tsx
    │   └── editor/
    │       └── MarkdownInput.test.tsx
    └── services/
        └── resumes.test.ts
```

---

## Phase A: Foundation

### Task 1: Project Scaffolding + Tooling

**PRD:** `00_README.md`

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `.env.example`, `.gitignore`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/styles/index.css`

- [ ] **Step 1: Initialize Vite React-TS project**

```bash
cd "C:/Users/steve/OneDrive/Documents/Repos/BragSheet"
npm create vite@latest . -- --template react-ts
```

Select: React, TypeScript

- [ ] **Step 2: Install core dependencies**

```bash
npm install react-router-dom firebase lucide-react
npm install -D tailwindcss @tailwindcss/vite postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind with custom design tokens from PRD 04**

Update `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EFF6FF",
          500: "#2563EB",
          600: "#1D4ED8",
          700: "#1E40AF",
        },
        success: "#16A34A",
        warning: "#D97706",
        error: "#DC2626",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        serif: ["Crimson Text", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: Configure Vite with Tailwind plugin**

Update `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});
```

- [ ] **Step 5: Set up index.css with Tailwind + Google Fonts**

Write `src/styles/index.css`:

```css
@import "tailwindcss";

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono&family=Crimson+Text:ital,wght@0,400;0,700;1,400&display=swap");
```

- [ ] **Step 6: Set up index.html with viewport meta**

Update `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="description" content="Write your resume in Markdown. Pick a template. Export a pixel-perfect one-page PDF or share a public link. No fluff." />
    <title>BragSheet - One-page resume builder for developers</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body class="bg-gray-50 font-sans text-gray-950 antialiased">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Write .env.example**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_STRIPE_PUBLISHABLE_KEY=
```

- [ ] **Step 8: Write .gitignore**

```
node_modules/
dist/
.env.local
.env
*.log
functions/lib/
functions/node_modules/
```

- [ ] **Step 9: Write test setup file**

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom";
```

- [ ] **Step 10: Verify project builds and dev server starts**

```bash
npm run dev
```

Expected: dev server starts on localhost:5173 with no errors.

- [ ] **Step 11: Init git and commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Vite + React + TypeScript + Tailwind project"
```

---

### Task 2: Firebase Configuration + Types

**PRD:** `00_README.md`, `02_Database_Schema.md`

**Files:**
- Create: `src/config/firebase.ts`, `src/types/user.ts`, `src/types/resume.ts`, `src/types/analytics.ts`, `src/types/api.ts`, `src/constants/reserved-words.ts`, `src/constants/pricing.ts`, `src/constants/templates.ts`

- [ ] **Step 1: Create Firebase config**

Write `src/config/firebase.ts`:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

enableIndexedDbPersistence(db).catch(() => {
  // Persistence failed -- multi-tab or browser doesn't support it
});
```

- [ ] **Step 2: Create TypeScript types matching Firestore schema**

Write `src/types/user.ts`:

```ts
import { Timestamp } from "firebase/firestore";

export interface Subscription {
  status: "free" | "active" | "past_due" | "canceled";
  stripeCustomerId: string | null;
  stripePriceId: string | null;
  currentPeriodEnd: Timestamp | null;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string | null;
  onboardingComplete: boolean;
  subscription: Subscription;
  paperSize: "us-letter" | "a4";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type AuthState =
  | "loading"
  | "unauthenticated"
  | "needs_onboarding"
  | "unverified"
  | "authenticated";
```

Write `src/types/resume.ts`:

```ts
import { Timestamp } from "firebase/firestore";

export interface Overflow {
  isOverflowing: boolean;
  scaleFactor: number;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  markdown: string;
  templateId: string;
  isDefault: boolean;
  paperSize: "us-letter" | "a4";
  overflow: Overflow;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Version {
  id: string;
  markdown: string;
  templateId: string;
  createdAt: Timestamp;
}
```

Write `src/types/analytics.ts`:

```ts
import { Timestamp } from "firebase/firestore";

export interface Analytics {
  userId: string;
  profileViews: number;
  pdfDownloads: number;
  lastViewedAt: Timestamp | null;
}
```

Write `src/types/api.ts`:

```ts
export interface ApiError {
  error: {
    code: string;
    message: string;
    retryAfter?: number;
  };
}
```

- [ ] **Step 3: Create constants**

Write `src/constants/reserved-words.ts`:

```ts
export const RESERVED_WORDS = new Set([
  "api", "admin", "settings", "www", "app", "help",
  "support", "about", "pricing", "blog", "sign-in",
  "sign-up", "editor", "dashboard", "onboarding",
  "verify-email", "privacy", "terms",
]);
```

Write `src/constants/pricing.ts`:

```ts
export const PRO_PRICE_MONTHLY = 8;
export const PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "";
export const FREE_RESUME_LIMIT = 1;
export const PRO_RESUME_LIMIT = 3;
```

Write `src/constants/templates.ts`:

```ts
export interface TemplateMeta {
  id: string;
  name: string;
  font: string;
  description: string;
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "classic", name: "Classic", font: "Crimson Text", description: "Traditional serif resume" },
  { id: "modern", name: "Modern", font: "Inter", description: "Clean sans-serif with blue accents" },
  { id: "minimal", name: "Minimal", font: "Inter", description: "Maximum content density" },
  { id: "technical", name: "Technical", font: "JetBrains Mono", description: "Monospace developer style" },
  { id: "compact", name: "Compact", font: "Inter", description: "Two-column high density" },
];

export const DEFAULT_TEMPLATE = "classic";
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Firebase config, TypeScript types, and app constants"
```

---

### Task 3: Auth System (Context, Hooks, Route Guards)

**PRD:** `01_Auth.md` — READ THIS FILE COMPLETELY before implementing.

**Files:**
- Create: `src/contexts/AuthContext.tsx`, `src/hooks/useAuth.ts`, `src/services/auth.ts`, `src/services/usernames.ts`, `src/components/auth/PublicRoute.tsx`, `src/components/auth/PrivateRoute.tsx`, `src/components/auth/OnboardingRoute.tsx`, `src/components/auth/SignInForm.tsx`, `src/components/auth/SignUpForm.tsx`, `src/components/auth/OAuthButtons.tsx`, `src/pages/SignIn.tsx`, `src/pages/SignUp.tsx`, `src/pages/Onboarding.tsx`, `src/pages/VerifyEmail.tsx`

**Key implementation notes:**
- AuthContext provides a state machine with 5 states: `loading`, `unauthenticated`, `needs_onboarding`, `unverified`, `authenticated`
- `onAuthStateChanged` listener determines state by checking: Firebase user exists? -> users doc exists with `onboardingComplete`? -> `emailVerified` (for email/password)?
- PublicRoute MUST redirect ALL signed-in states (not just authenticated) — see CLAUDE.md rule
- Use `getAuth(app)` not `initializeAuth` — see CLAUDE.md rule
- Username claim during onboarding uses batched writes: create `usernames/{slug}` + update `users/{uid}` atomically
- OAuth users skip `unverified` state
- Account linking error (`auth/account-exists-with-different-credential`): show prompt, don't auto-link

- [ ] **Step 1: Create auth service with signUp, signIn, OAuth, signOut**

Implement `src/services/auth.ts` with all Firebase Auth operations. Handle `signInWithPopup` for Google and GitHub. Handle `createUserWithEmailAndPassword` + `sendEmailVerification` for email.

- [ ] **Step 2: Create username service**

Implement `src/services/usernames.ts` with `checkAvailability(username)` and `claimUsername(uid, username, displayName)`. The claim function creates the initial `users` doc, `usernames` doc, and first empty `resumes` doc + `analytics` doc in a batched write.

- [ ] **Step 3: Create AuthContext with state machine**

Implement `src/contexts/AuthContext.tsx`. The provider listens to `onAuthStateChanged`, fetches the user doc from Firestore, and determines the auth state. Expose `authState`, `user`, `firebaseUser`, and auth actions.

- [ ] **Step 4: Create useAuth hook**

Simple wrapper: `export const useAuth = () => useContext(AuthContext)`.

- [ ] **Step 5: Create route guards**

- `PublicRoute`: redirects `authenticated` -> `/dashboard`, `needs_onboarding` -> `/onboarding`, `unverified` -> `/verify-email`
- `PrivateRoute`: redirects `unauthenticated` -> `/sign-in`, `needs_onboarding` -> `/onboarding`, `unverified` -> `/verify-email`
- `OnboardingRoute`: requires `needs_onboarding`. Authenticated -> editor/dashboard, unauthenticated -> sign-in.

- [ ] **Step 6: Build SignIn, SignUp, Onboarding, VerifyEmail pages**

- SignIn: email/password form + OAuth buttons + "Forgot password" link
- SignUp: email/password form + OAuth buttons
- Onboarding: username input with real-time availability check, submit claims username
- VerifyEmail: message + resend button with 60s cooldown

- [ ] **Step 7: Wire up App.tsx with router and AuthProvider**

Set up React Router with all routes and guards. Wrap everything in AuthProvider.

- [ ] **Step 8: Test route guards manually and commit**

```bash
git add -A
git commit -m "feat: implement Firebase Auth with route guards and onboarding flow"
```

---

### Task 4: UI Component Library

**PRD:** `04_UI_Design_System.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Card.tsx`, `src/components/ui/Modal.tsx`, `src/components/ui/Toast.tsx`, `src/components/ui/Skeleton.tsx`, `src/components/ui/OverflowMenu.tsx`, `src/contexts/ToastContext.tsx`, `src/hooks/useToast.ts`

**Key specs from PRD:**
- Buttons: 4 variants (primary, secondary, ghost, danger). `h-9 px-4 text-sm font-medium rounded-md transition-colors`. Disabled at 50% opacity.
- Inputs: `h-9 px-3 text-sm rounded-md border border-gray-300`. Focus: `ring-2 ring-brand-500 ring-offset-1`.
- Cards: `bg-white rounded-lg border border-gray-300 p-4`. Hover shadow only on interactive cards.
- Toasts: bottom-right stacked, `max-w-sm`, colored left border. Auto-dismiss 4s success/info, persistent errors.
- Modal: centered overlay with backdrop. Full-screen on mobile.
- Skeleton: gray pulsing rectangles.

- [ ] **Step 1: Build Button component with all 4 variants**
- [ ] **Step 2: Build Input component with error state**
- [ ] **Step 3: Build Card component**
- [ ] **Step 4: Build Modal component**
- [ ] **Step 5: Build ToastContext + Toast component**

Toast queue with auto-dismiss. Three variants: success (green border), error (red border), info (blue border).

- [ ] **Step 6: Build Skeleton and OverflowMenu components**
- [ ] **Step 7: Build useToast hook**
- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add UI component library (Button, Input, Card, Modal, Toast, Skeleton)"
```

---

## Phase B: Core Editor

### Task 5: Markdown Rendering Pipeline

**PRD:** `06_Markdown_Editor.md` (rendering pipeline section), `08_Template_System.md`

**Files:**
- Create: `src/lib/markdown.ts`, `tests/lib/markdown.test.ts`

**Key specs:**
- Pipeline: markdown -> remark-parse -> remark-gfm -> remark-breaks -> remark-rehype -> rehype-sanitize -> rehype-stringify -> HTML string
- Supported: headings, bold, italic, lists, links, horizontal rules, GFM tables, line breaks
- Stripped: images, code blocks, raw HTML, blockquotes
- This module is shared between client and Cloud Functions — keep it isomorphic (no DOM dependencies)

- [ ] **Step 1: Install remark dependencies**

```bash
npm install unified remark-parse remark-gfm remark-breaks remark-rehype rehype-sanitize rehype-stringify
```

- [ ] **Step 2: Write tests for markdown pipeline**

Test cases: headings render to h1-h3, bold/italic, lists, links, hr, tables, images stripped, code blocks stripped, raw HTML stripped.

- [ ] **Step 3: Implement markdown.ts**

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const schema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    "h1", "h2", "h3", "p", "strong", "em", "a", "ul", "ol", "li",
    "hr", "table", "thead", "tbody", "tr", "th", "td", "br",
  ],
  // Remove: img, pre, code, blockquote
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkRehype)
  .use(rehypeSanitize, schema)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  const result = await processor.process(markdown);
  return String(result);
}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run tests/lib/markdown.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add shared markdown rendering pipeline with remark"
```

---

### Task 6: Template CSS System

**PRD:** `08_Template_System.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/styles/templates/base.css`, `src/styles/templates/classic.css`, `src/styles/templates/modern.css`, `src/styles/templates/minimal.css`, `src/styles/templates/technical.css`, `src/styles/templates/compact.css`

**Key specs:**
- Templates are CSS-only. All scoped under `[data-template="<id>"] .resume-content` selectors.
- `base.css`: paper container, font-smoothing, link normalization, table border-collapse.
- Each template defines: font family/sizes, heading styles, section spacing, list style, divider treatment, color.
- The `compact` template uses `column-count: 2` for two-column layout.
- All templates must work at 0.75x scale (minimum font ~9px).
- Paper padding: 48px (0.5" margins at 96 DPI).

- [ ] **Step 1: Write base.css**

Shared styles: `.resume-content` base, link color inherit, table collapse, font smoothing.

- [ ] **Step 2: Write classic.css**

Crimson Text serif, 11.5pt body, 18pt h1 centered, 12pt h2 uppercase with bottom border.

- [ ] **Step 3: Write modern.css**

Inter, 10.5pt body, 20pt h1, blue h2 headings, no-bullet lists with left border.

- [ ] **Step 4: Write minimal.css**

Inter, 10pt body, small uppercase gray headings, dash bullets, tight spacing.

- [ ] **Step 5: Write technical.css**

JetBrains Mono, 9.5pt body, bold headings with bottom border, `>` prefix bullets.

- [ ] **Step 6: Write compact.css**

Inter 9.5pt, `column-count: 2` triggered after first `hr`, full-width h1 + first p.

- [ ] **Step 7: Import all template CSS in index.css**

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add 5 resume template CSS (classic, modern, minimal, technical, compact)"
```

---

### Task 7: Editor Page (Split Panel + Markdown Input + Preview)

**PRD:** `06_Markdown_Editor.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/pages/Editor.tsx`, `src/components/editor/EditorLayout.tsx`, `src/components/editor/MarkdownInput.tsx`, `src/components/editor/ResumePreview.tsx`, `src/components/editor/PaperContainer.tsx`, `src/components/layout/AppNav.tsx`, `src/components/layout/StatusBar.tsx`, `src/hooks/useDebounce.ts`
- Create: `src/services/resumes.ts`, `src/hooks/useResume.ts`

**Key specs:**
- Split panel: 50/50 default, resizable via drag handle, min 320px per side
- Below `lg` (1024px): tabbed Edit/Preview
- Textarea: JetBrains Mono 14px, no syntax highlighting, soft wrap, 24px padding
- Keyboard: Ctrl+S force save, Tab inserts 2 spaces
- Paste: plain text only (strip rich text)
- Preview: paper container at real dimensions (US Letter 816x1056 or A4 794x1123), centered, scaled via CSS transform to fit panel
- Render debounce: 150ms
- Auto-save debounce: 1500ms (PRD 18 updates the 2s from PRD 06 to 1.5s)
- Status bar: save status left, paper size right (clickable toggle)
- AppNav: logo, editable resume title, template button, export button, share button, kebab menu

- [ ] **Step 1: Create resume service (Firestore CRUD)**

Implement `src/services/resumes.ts`: `getResume`, `getDefaultResume`, `getUserResumes`, `updateResume`, `createResume`, `deleteResume`, `setDefault`.

- [ ] **Step 2: Create useResume hook with auto-save**

Hook manages: loading resume, updating local state, debounced saves, save status tracking, Ctrl+S handler, localStorage backup.

- [ ] **Step 3: Build MarkdownInput component**

Textarea with keyboard shortcuts (Ctrl+S, Tab), plain-text paste handler, `font-mono text-sm`, auto-growing on mobile.

- [ ] **Step 4: Build PaperContainer component**

Paper-sized div with correct dimensions per paper size, scaled via `transform: scale()` to fit parent width. `bg-white shadow-lg`.

- [ ] **Step 5: Build ResumePreview component**

Renders markdown HTML inside PaperContainer with `data-template` attribute. Uses `dangerouslySetInnerHTML` with sanitized content from the remark pipeline.

- [ ] **Step 6: Build EditorLayout with split panels**

Desktop: resizable horizontal split. Mobile (< lg): tabbed Edit/Preview with tab switcher. Save on tab switch for mobile.

- [ ] **Step 7: Build AppNav and StatusBar**

AppNav: logo (link to dashboard), inline-editable title, template button, export button, share button (copies URL), kebab menu.
StatusBar: save status, paper size toggle.

- [ ] **Step 8: Build Editor page**

Compose: AppNav + EditorLayout(MarkdownInput, ResumePreview) + StatusBar. Load resume from URL param or default.

- [ ] **Step 9: Test editor manually — type markdown, see preview update**

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: build markdown editor with live preview, auto-save, and split panel layout"
```

---

### Task 8: One-Page Constraint System

**PRD:** `07_One_Page_Constraint.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/components/editor/MeasureContainer.tsx`, `src/components/editor/OverflowWarning.tsx`, `src/hooks/useOverflow.ts`

**Key specs:**
- Measurement: off-screen div at exact paper size, `visibility: hidden`, no CSS transform, compare `scrollHeight` vs `clientHeight`
- Scale steps: 1.0, 0.95, 0.90, 0.85, 0.80, 0.75 (floor)
- Scale applies to content wrapper inside paper (not paper itself), `transform-origin: top left`, width set to `100% / scaleFactor`
- Warning bar: amber for 0.75 < scale < 1.0, red at 0.75 floor
- Measure after every render (debounced 150ms with preview)
- Save overflow state with resume auto-save (not on every measurement)

- [ ] **Step 1: Build MeasureContainer**

Off-screen div (`position: absolute; left: -9999px`), exact paper dimensions, same template styles, `visibility: hidden`.

- [ ] **Step 2: Build useOverflow hook**

Takes rendered HTML + template + paper size. Runs measurement cycle: inject HTML into measure container, check overflow, binary search for scale factor. Returns `{ isOverflowing, scaleFactor }`.

- [ ] **Step 3: Build OverflowWarning component**

Amber bar: "Content exceeds one page. Auto-scaled to {X}%." Red bar at 0.75: "Maximum scaling reached. Trim content to fit one page." Dismiss button (reappears on next measurement).

- [ ] **Step 4: Integrate into ResumePreview**

Apply scale factor to content wrapper. Show/hide OverflowWarning.

- [ ] **Step 5: Test with long content — verify scaling kicks in**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement one-page constraint with overflow detection and auto-scaling"
```

---

### Task 9: Template Picker

**PRD:** `08_Template_System.md` (picker section)

**Files:**
- Create: `src/components/templates/TemplatePicker.tsx`, `src/components/templates/TemplateCard.tsx`

**Key specs:**
- Full-screen overlay (`fixed inset-0 bg-white z-50`)
- Grid: 3 cols desktop, 2 tablet, 1 mobile
- Each card: live preview of user's resume with that template's CSS
- Active template: `ring-2 ring-brand-500`
- Template name below card
- Apply + Cancel buttons
- Free users: lock icon on non-classic templates, "Upgrade to unlock" on click
- Render all 5 previews once on open, swap CSS class for instant switching

- [ ] **Step 1: Build TemplateCard**

Paper-aspect-ratio card with miniature rendered resume. Lock icon overlay for locked templates.

- [ ] **Step 2: Build TemplatePicker**

Full-screen overlay, grid of TemplateCards, Apply/Cancel. On apply: update `templateId` on resume doc, trigger overflow re-measurement.

- [ ] **Step 3: Wire picker into AppNav template button**

- [ ] **Step 4: Test template switching — verify preview updates and overflow recalculates**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add template picker with live preview and free/paid gating"
```

---

### Task 10: Landing Page

**PRD:** `05_Landing_Page.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/pages/Landing.tsx`, `src/components/layout/LandingNav.tsx`

**Key specs:**
- Six sections: Nav (sticky), Hero, How It Works, Template Showcase, Pricing, Footer
- Hero: "One page. Markdown. Done." headline, subheadline, CTA button, right column with editor preview mockup
- How It Works: 3 cards with Lucide icons (Code, Layout, Download)
- Template Showcase: grid of template thumbnail images (placeholder gray rectangles initially)
- Pricing: Free vs Pro columns, Pro card with brand border + "Most popular" badge
- Footer: wordmark + copyright, Privacy/Terms links
- Mobile: stack vertically, hide sign-in button, template showcase horizontal scroll, pricing Pro first
- No dark mode

- [ ] **Step 1: Build LandingNav**

Sticky, `h-14`, `bg-white/80 backdrop-blur-sm`. Logo left, Sign In (ghost) + Get Started (primary) right. Mobile: only Get Started.

- [ ] **Step 2: Build Hero section**

Two columns desktop, stacked mobile. Headline, sub, CTA, placeholder preview image.

- [ ] **Step 3: Build How It Works section**

3 cards with Lucide icons, centered headings.

- [ ] **Step 4: Build Template Showcase section**

Grid of template preview cards (placeholder images). Horizontal scroll on mobile.

- [ ] **Step 5: Build Pricing section**

Free + Pro cards side by side, max-w-2xl centered. Pro card highlighted.

- [ ] **Step 6: Build Footer**

Wordmark, copyright, Privacy/Terms links.

- [ ] **Step 7: Compose Landing page**

- [ ] **Step 8: Add Privacy and Terms placeholder pages**

Create `src/pages/Privacy.tsx` and `src/pages/Terms.tsx` with placeholder legal text.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: build landing page with hero, features, template showcase, and pricing"
```

---

## Phase C: Output

### Task 11: Cloud Functions Setup + Shared Markdown Pipeline

**PRD:** `03_API_Endpoints.md`, `09_PDF_Export.md`

**Files:**
- Create: `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`, `functions/src/config.ts`, `functions/src/middleware/auth.ts`, `functions/src/lib/markdown.ts`

- [ ] **Step 1: Initialize Cloud Functions**

```bash
cd functions
npm init -y
npm install firebase-admin firebase-functions express cors stripe
npm install -D typescript @types/express @types/cors
```

- [ ] **Step 2: Configure tsconfig.json for functions**

Target: ES2020, module: commonjs, outDir: lib.

- [ ] **Step 3: Create Express app skeleton in index.ts**

Export a single `api` function that wraps an Express app with CORS and JSON middleware.

- [ ] **Step 4: Create auth middleware**

Verify Bearer token (Firebase Auth) OR X-API-Key (agent). Return userId for downstream handlers.

- [ ] **Step 5: Copy markdown pipeline to functions/src/lib/markdown.ts**

Same remark pipeline as client. Install remark deps in functions.

- [ ] **Step 6: Create config.ts with environment variable helpers**

Stripe secret key, webhook secret, price ID from Cloud Functions config.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Cloud Functions with Express, auth middleware, and shared markdown pipeline"
```

---

### Task 12: PDF Export (Cloud Function + Client Integration)

**PRD:** `09_PDF_Export.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `functions/src/lib/pdf.ts`, `functions/src/routes/pdf.ts`
- Modify: `functions/src/index.ts` (register route)
- Modify: `src/components/layout/AppNav.tsx` (export button behavior)

**Key specs:**
- `POST /api/pdf/generate`: auth required, paid check, render markdown to HTML with template CSS, apply scale factor, Puppeteer PDF
- Use `puppeteer-core` + `@sparticuz/chromium` for Cloud Functions compatibility
- Paper: US Letter 8.5x11in, A4 210x297mm, margins 0 (padding in HTML)
- `printBackground: true`, `waitUntil: 'networkidle0'`
- Bundle woff2 fonts in functions deployment (Option A from PRD)
- Response: `Content-Type: application/pdf`, `Content-Disposition: attachment`
- Cloud Function: 1GB memory, 60s timeout, concurrency 1
- Increment `analytics.pdfDownloads` on success

- [ ] **Step 1: Install Puppeteer deps in functions**

```bash
cd functions
npm install puppeteer-core @sparticuz/chromium
```

- [ ] **Step 2: Download and bundle font woff2 files**

Download Inter, Crimson Text, JetBrains Mono woff2 files into `functions/fonts/`.

- [ ] **Step 3: Build HTML document builder in pdf.ts**

Function that takes markdown, templateId, scaleFactor, paperSize and builds a complete HTML document with embedded fonts, template CSS, and scale transform.

- [ ] **Step 4: Build Puppeteer PDF generator**

Launch chromium, setContent, page.pdf with correct dimensions.

- [ ] **Step 5: Build PDF route handler**

Verify auth, check paid status, fetch resume, build HTML, generate PDF, increment analytics, return binary.

- [ ] **Step 6: Register route in index.ts**

- [ ] **Step 7: Update AppNav export button**

Paid users: "Export PDF" -> loading state -> download. Free users: "Upgrade to export" -> Stripe checkout.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: implement server-side PDF export via Puppeteer in Cloud Functions"
```

---

### Task 13: Public Profiles

**PRD:** `10_Public_Profiles.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `functions/src/routes/profile.ts`, `src/pages/PublicProfile.tsx`, `src/components/profile/ProfileResume.tsx`, `src/components/profile/ProfileActions.tsx`
- Modify: `functions/src/index.ts`, `src/App.tsx` (add /:username route)

**Key specs:**
- `GET /api/profile/:username`: public, no auth. Resolve username -> uid -> default resume -> render HTML -> return `{ displayName, photoURL, resumeHtml, templateId, paperSize, lastUpdated, showBranding }`
- `GET /api/profile/:username/meta`: return OG data for link previews
- Increment `analytics.profileViews` (fire-and-forget, don't await)
- Cache-Control: `public, max-age=300` for profile, `max-age=3600` for meta
- Profile page: minimal nav (BragSheet logo), centered paper-sized resume, "Copy Link" button, "Download PDF" only for authenticated owner
- Free tier: "Built with BragSheet -- Create yours" footer
- 404: "This profile doesn't exist" + CTA
- Route `/:username` must be LAST in router (lowest priority)
- On mobile: no paper simulation, content fills viewport

- [ ] **Step 1: Build profile API routes**

`GET /api/profile/:username` — resolve, render, return HTML. `GET /api/profile/:username/meta` — return OG data.

- [ ] **Step 2: Register routes in index.ts**

- [ ] **Step 3: Build PublicProfile page**

Fetch from API, render ProfileResume + ProfileActions. Handle 404.

- [ ] **Step 4: Build ProfileResume component**

Paper container with rendered HTML, template CSS, scale factor. On mobile: full-width, no paper shadow.

- [ ] **Step 5: Build ProfileActions**

Copy Link button. Download PDF (only for authenticated owner).

- [ ] **Step 6: Add /:username route as catch-all in App.tsx**

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: implement public profiles at /:username with server-side rendering"
```

---

## Phase D: Management

### Task 14: Dashboard

**PRD:** `11_Dashboard.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/pages/Dashboard.tsx`, `src/components/dashboard/ResumeGrid.tsx`, `src/components/dashboard/ResumeCard.tsx`, `src/components/dashboard/CreateResumeModal.tsx`, `src/components/dashboard/SortDropdown.tsx`
- Create: `src/services/analytics.ts`

**Key specs:**
- Post-auth routing: 1 resume -> `/editor`, 2+ -> `/dashboard`, 0 -> `/editor` (create default)
- Grid: 3 cols desktop, 2 tablet, 1 mobile
- ResumeCard: thumbnail preview, title, default badge, analytics, updated time, Edit button, overflow menu (set default, duplicate, rename, delete)
- Thumbnails: render client-side in hidden container, scale down
- Create modal: title input, creates resume via API, navigates to editor
- Sort: last updated (default), name, most viewed
- Empty state: "No resumes yet" + CTA
- On mobile: drop thumbnails, compact cards

- [ ] **Step 1: Build analytics service**

Fetch analytics docs for resume IDs.

- [ ] **Step 2: Build ResumeCard**

Thumbnail, title, badges, analytics, actions.

- [ ] **Step 3: Build CreateResumeModal**

Title input, create button, limit check.

- [ ] **Step 4: Build ResumeGrid with sorting**

- [ ] **Step 5: Build Dashboard page with post-auth routing logic**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: build dashboard with resume cards, create modal, and sorting"
```

---

### Task 15: Resume Variants API

**PRD:** `12_Resume_Variants.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `functions/src/routes/resumes.ts`
- Modify: `functions/src/index.ts`

**Key specs:**
- `POST /api/resumes/create`: enforce variant limit (free: 1, paid: 3) via count query
- `POST /api/resumes/set-default`: batched write (old default false, new default true)
- `DELETE /api/resumes/:resumeId`: delete resume + versions subcollection + analytics doc. Cannot delete last resume. If deleting default, promote most recent.

- [ ] **Step 1: Build create endpoint with limit enforcement**
- [ ] **Step 2: Build set-default endpoint with batched write**
- [ ] **Step 3: Build delete endpoint with cascade delete**
- [ ] **Step 4: Register routes**
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add resume variant management API (create, set-default, delete)"
```

---

### Task 16: Version History

**PRD:** `13_Version_History.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/services/versions.ts`, `src/components/versions/VersionPanel.tsx`, `src/components/versions/VersionEntry.tsx`
- Create: `functions/src/routes/versions.ts`, `functions/src/scheduled/cleanupVersions.ts`

**Key specs:**
- Snapshots created on: manual save (Ctrl+S), 5min idle threshold, template switch, restore, session start
- Version list: slide-over panel from right, 320px, paginated (20 per page, max 50)
- Preview: clicking entry shows that version's content in preview panel, non-destructive
- Restore: `POST /api/resumes/:resumeId/versions/restore` — snapshot current state first, then overwrite
- Cleanup: scheduled function daily at 03:00 UTC, delete beyond 50 per resume
- Free tier: version history access gated (data accumulates but UI hidden)

- [ ] **Step 1: Build versions service (client)**

Create snapshot, list versions with pagination.

- [ ] **Step 2: Build version API routes (server)**

GET list + POST restore.

- [ ] **Step 3: Build VersionPanel and VersionEntry components**

Slide-over, entry list, version preview, restore button.

- [ ] **Step 4: Build cleanup scheduled function**

- [ ] **Step 5: Integrate into editor — snapshot triggers + menu entry**

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement version history with snapshots, restore, and scheduled cleanup"
```

---

## Phase E: Monetization

### Task 17: Stripe Billing

**PRD:** `14_Stripe_Billing.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `functions/src/routes/stripe.ts`, `src/services/stripe.ts`, `src/pages/Settings.tsx`, `src/components/settings/SubscriptionCard.tsx`

**Key specs:**
- Single plan: Pro at $8/mo
- `POST /api/stripe/create-checkout-session`: creates Stripe Checkout session with `client_reference_id` = Firebase UID
- `POST /api/stripe/create-portal-session`: creates Stripe Customer Portal session
- `POST /api/stripe/webhook`: handle `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- Webhook writes to `customers/{uid}` then syncs to `users/{uid}.subscription`
- Idempotency: check `stripeEvents/{event.id}` before processing
- Settings page: subscription status card, manage/upgrade button
- Post-checkout: poll `users.subscription.status` for up to 10s
- Cancellation: retains access until period end, show date + resubscribe option
- Downgrade: no data deleted, features re-gated

- [ ] **Step 1: Build Stripe webhook handler**

Verify signature, handle all 4 events, idempotency check.

- [ ] **Step 2: Build checkout and portal session endpoints**

- [ ] **Step 3: Build client-side stripe service**

Call checkout/portal endpoints, redirect to Stripe.

- [ ] **Step 4: Build Settings page with SubscriptionCard**

Show tier status, upgrade/manage button, cancellation notice.

- [ ] **Step 5: Wire up all upgrade CTAs across the app**

Export button, template lock, variant limit, version history gate.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement Stripe billing with checkout, webhooks, and subscription management"
```

---

### Task 18: Profile Analytics Display

**PRD:** `15_Profile_Analytics.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `functions/src/routes/analytics.ts`
- Modify: `src/components/dashboard/ResumeCard.tsx` (add analytics display)

**Key specs:**
- Dashboard cards show: "{views} views * {downloads} downloads" for paid users
- Free users: "Upgrade to see analytics" or hide line
- `GET /api/analytics/:resumeId`: auth required, returns counters
- Data accumulates for free users (visible on upgrade)
- No dedicated analytics page at MVP

- [ ] **Step 1: Build analytics API route**
- [ ] **Step 2: Add analytics display to ResumeCard**
- [ ] **Step 3: Gate display behind paid tier check**
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add profile analytics display on dashboard cards"
```

---

## Phase F: Extension

### Task 19: Agent API

**PRD:** `16_Agent_API.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `functions/src/routes/agent.ts`, `functions/src/middleware/rateLimit.ts`
- Create: `src/components/settings/ApiKeyList.tsx`, `src/components/settings/ApiKeyDialog.tsx`
- Modify: `functions/src/middleware/auth.ts` (API key flow already planned)
- Modify: `src/pages/Settings.tsx` (add API keys section)

**Key specs:**
- API keys: `brag_sk_live_{32 hex}`, stored hashed (SHA-256), shown once
- New collection: `apiKeys` with `keyHash`, `keyPrefix`, `userId`, `name`, `isActive`, `lastUsedAt`
- Key limits: max 3 per user, paid tier only
- Rate limits: 30 req/min, 10 PDF/hour, 5 creates/hour per key
- Agent endpoints: GET/POST/PUT/DELETE resumes, POST set-default, POST export, GET analytics, GET templates
- Same error format as all other endpoints

- [ ] **Step 1: Build rate limiting middleware**

Firestore-based counter per key per time window.

- [ ] **Step 2: Build agent CRUD routes**

All resume management, export, analytics, templates endpoints.

- [ ] **Step 3: Build API key generation and management**

Server: generate key, hash, store. Client: settings UI for key list + generate dialog.

- [ ] **Step 4: Add API keys section to Settings page**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement agent API with API key auth, rate limiting, and CRUD endpoints"
```

---

### Task 20: Error Handling + Save Resilience

**PRD:** `18_Error_Handling_Saves.md` — READ THIS FILE COMPLETELY.

**Files:**
- Create: `src/hooks/useOnlineStatus.ts`
- Modify: `src/hooks/useResume.ts` (retry logic, localStorage backup, conflict detection, beacon save)
- Modify: `src/components/layout/StatusBar.tsx` (offline indicator)

**Key specs:**
- Retry: 2s, 5s, 15s, 30s, 60s cap. Continue indefinitely.
- After 3 failures: show banner "Unable to save. Your changes are stored locally."
- localStorage backup: write on every debounce, key `bragsheet_backup_{resumeId}`. On load: check if backup is newer than server, offer recovery.
- Conflict detection: include `expectedUpdatedAt` in save, server returns 409 if stale. Show conflict modal (keep mine / load server / view both).
- Offline: listen `online`/`offline` events, save to localStorage only, sync on reconnect.
- `beforeunload`: fire `navigator.sendBeacon` save attempt.
- Auth expiration: show "Session expired" banner on 401.
- Save deduplication: skip save if content unchanged from last successful save.

- [ ] **Step 1: Build useOnlineStatus hook**
- [ ] **Step 2: Enhance useResume with retry logic and exponential backoff**
- [ ] **Step 3: Add localStorage backup and recovery**
- [ ] **Step 4: Add conflict detection and resolution modal**
- [ ] **Step 5: Add beforeunload guard with sendBeacon**
- [ ] **Step 6: Update StatusBar for offline state**
- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add save resilience with retry, offline backup, and conflict resolution"
```

---

### Task 21: Mobile Polish

**PRD:** `17_Mobile_Experience.md` — READ THIS FILE COMPLETELY.

**Files:**
- Modify: multiple components for responsive behavior

**Key specs:**
- Editor: tabbed Edit/Preview below 768px. Textarea min 16px font (prevent iOS zoom). Save on tab switch.
- Dashboard: single column, drop thumbnails on mobile, overflow menu for actions.
- Public profile: no paper simulation on mobile, full-width content.
- Landing: stack everything, template carousel horizontal scroll, pricing Pro card first.
- Touch targets: minimum 44x44px.
- Bottom tab bar on mobile: Dashboard | Editor | Settings.
- `viewport-fit=cover`, `env(safe-area-inset-bottom)` on fixed elements.

- [ ] **Step 1: Audit all components for responsive breakpoints**
- [ ] **Step 2: Add mobile tab bar navigation**
- [ ] **Step 3: Fix touch targets and font sizes**
- [ ] **Step 4: Polish public profile mobile layout**
- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: polish mobile experience across editor, dashboard, and public profiles"
```

---

## Phase G: Security, Deploy, and Polish

### Task 22: Firestore Security Rules + Storage Rules

**PRD:** `02_Database_Schema.md` (security rules sections)

**Files:**
- Create: `firestore.rules`, `firestore.indexes.json`, `storage.rules`

**Key specs:**
- `users`: read/write only by `request.auth.uid == documentId`. `subscription` fields writable only by admin SDK.
- `usernames`: create if authenticated + uid matches + doc doesn't exist. Read: anyone. Update: denied. Delete: owner only.
- `resumes`: read/write if `request.auth.uid == resource.data.userId`. Public read for default resume (via profile API using admin SDK).
- `versions`: inherit from parent resume.
- `analytics`: read by owner. `profileViews` increment: admin SDK only. `pdfDownloads`: admin SDK only.
- `customers`: read by owner. Write: denied (admin SDK only).
- `apiKeys`: read/write by owner.
- Storage: `photos/{uid}/**` — read/write by uid, max 5MB, image types only.
- Composite indexes: resumes(userId+createdAt), resumes(userId+isDefault), versions(createdAt DESC).

- [ ] **Step 1: Write firestore.rules**
- [ ] **Step 2: Write firestore.indexes.json**
- [ ] **Step 3: Write storage.rules**
- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add Firestore security rules, indexes, and Storage rules"
```

---

### Task 23: Firebase Configuration + Deploy

**PRD:** `00_README.md`

**Files:**
- Create/modify: `firebase.json`

- [ ] **Step 1: Check Firebase login**

```bash
firebase login:use steve.petusky@gmail.com
firebase login:list
```

- [ ] **Step 2: Create Firebase project**

```bash
firebase projects:create --display-name "BragSheet"
```

Pick unique project ID like `bragsheet-app`.

- [ ] **Step 3: Initialize Firebase services**

```bash
firebase init
```

Enable: Hosting (dist), Firestore, Cloud Functions (TypeScript), Storage.

- [ ] **Step 4: Configure firebase.json**

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
}
```

- [ ] **Step 5: Set .env.local with Firebase project config**

Get config from Firebase Console and set all VITE_FIREBASE_* vars.

- [ ] **Step 6: Build production bundle**

```bash
npm run build
```

- [ ] **Step 7: Build Cloud Functions**

```bash
cd functions && npm run build
```

- [ ] **Step 8: Deploy**

```bash
firebase deploy
```

- [ ] **Step 9: Verify app is live**

- [ ] **Step 10: Commit firebase.json and configs**

```bash
git add -A
git commit -m "chore: configure Firebase Hosting, Firestore, Functions, and deploy"
```

---

### Task 24: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write professional README**

Follow the README requirement from CLAUDE.md: centered header, badges, overview, features table, tech stack, architecture, getting started, env setup.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

## Execution Notes

**Task dependencies:**
- Tasks 1-2 must complete before anything else
- Task 3 (auth) before any pages
- Task 4 (UI lib) before any UI work (but can parallel with Task 3)
- Tasks 5-6 (markdown + templates) before Task 7 (editor)
- Task 7 before Task 8 (overflow)
- Task 11 (Cloud Functions setup) before Tasks 12-13
- Task 14 (dashboard) after Task 7 (editor)
- Task 17 (Stripe) before Tasks that check paid status in UI
- Task 22 (security rules) anytime, but deploy-blocking
- Task 23 (deploy) is last

**Parallelizable groups:**
- Tasks 3 + 4 (auth + UI lib)
- Tasks 5 + 6 (markdown + template CSS)
- Tasks 14 + 15 (dashboard + variants API)
- Tasks 18 + 19 (analytics + agent API)
- Tasks 20 + 21 (error handling + mobile polish)
