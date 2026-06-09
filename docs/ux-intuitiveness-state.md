# UX Intuitiveness State

## Current Phase: 5 (Implementation) -- Complete
## Completed: [1, 2, 3, 4, 5]

## Phase 1 (Discovery) — Complete
- [x] Step 1: Read project identity
- [x] Step 2: Detect tech stack
- [x] Step 3: Inventory all pages
- [x] Step 4: Map navigation structure
- [x] Step 5: Identify existing UX patterns
- [x] Step 6: Check for design system
- [x] Step 7: Output discovery summary
- [x] Step 8: Write state file

## Phase 2 (Workflow Audit) — Complete
- [x] Step 1: Load references (workflow-gap-types.md)
- [x] Step 2: Discover workflows
- [x] Step 3: Walk each workflow
- [x] Step 4: Identify cross-workflow dependencies
- [x] Step 5: Rate workflow health
- [x] Step 6: Output workflow map
- [x] Step 7: Update state
- [x] Step 8: Load Phase 3

## Phase 3 (Page Scorecard) -- Complete
- [x] Step 1: Load references (ux-layers.md)
- [x] Step 2: Score each page
- [x] Step 3: Cross-reference with workflow gaps
- [x] Step 4: Generate findings (20 total: 3 critical, 7 high, 7 medium, 3 low)
- [x] Step 5: Write audit report (docs/ux-audit-report.md)
- [x] Step 6: Present summary
- [x] Step 7: Update state
- [x] Step 8: Load Phase 4

## Findings Status
| ID | Severity | Status | Description |
|----|----------|--------|-------------|
| UX-001 | Critical | fixed | Editor blank state: added GuidanceTip in EditorLayout when markdown < 30 chars |
| UX-002 | Critical | fixed | Public profile 404: distinguished NO_RESUME vs NOT_FOUND with separate UI |
| UX-003 | Critical | fixed | Editor tab sequence: added workflow-order GuidanceTip in Editor.tsx |
| UX-004 | High | skipped | Sign-up: "You'll pick a username next" added to SignUp subtitle (lightweight fix) |
| UX-005 | High | fixed | Editor next-step nudges: added state-aware "try Design" tip after 50+ words |
| UX-006 | High | fixed | AI Polish: added markdown bullet syntax example with code block |
| UX-007 | High | fixed | Dashboard: added resume count indicator (N of M) |
| UX-008 | High | deferred | Dashboard aggregate metrics: deferred to avoid over-engineering |
| UX-009 | High | fixed | Dashboard: enriched empty state with EmptyState component, icon, better copy |
| UX-010 | High | fixed | Version history: added History button + Ctrl+S hint in StatusBar |
| UX-011 | Medium | already-fixed | AI Polish already has Apply Changes button |
| UX-012 | Medium | fixed | Import tab: improved description and placeholder text |
| UX-013 | Medium | fixed | Editor: added word count to StatusBar |
| UX-014 | Medium | deferred | Dashboard success toast: deferred (create flow already closes modal + opens editor) |
| UX-015 | Medium | fixed | Settings: added API description with links to /docs and /agents |
| UX-016 | Medium | deferred | Admin model list: admin-only, low user impact |
| UX-017 | Medium | already-fixed | Sign-in already has Forgot password link |
| UX-018 | Low | already-fixed | Agent Guide already has /docs links at end |
| UX-019 | Low | deferred | Admin setup order: admin-only, low user impact |
| UX-020 | Low | fixed | Sign-up: added "You'll pick a username next" to subtitle |

## Phase 4 (Components) -- Complete
- [x] Step 1: Load references (component-catalog.md, anti-patterns.md)
- [x] Step 2: Analyze findings for patterns (3 components needed by 3+ findings)
- [x] Step 3: Determine component directory (src/components/ux/)
- [ ] Step 4: Fetch library documentation -- skipped: using existing Tailwind v4 design tokens already in project
- [x] Step 5: Build components (GuidanceTip, NextStepCard, EmptyState)
- [x] Step 6: Verify build (tsc --noEmit passed clean)
- [x] Step 7: Update state
- [x] Step 8: Load Phase 5

### Components Created
| Component | File | Used By |
|-----------|------|---------|
| GuidanceTip | src/components/ux/GuidanceTip.tsx | UX-001,003,005,006,007,012,015,017,019,020 |
| NextStepCard | src/components/ux/NextStepCard.tsx | UX-005,009,018,020 |
| EmptyState | src/components/ux/EmptyState.tsx | UX-001,006,016 |

## Project
- **Name:** OneSheet
- **Domain:** Career / Resume building
- **Target Users:** Developers and job seekers who prefer writing in Markdown
- **Framework:** React 19
- **CSS:** Tailwind CSS v4 (design tokens via @theme in index.css)
- **Component Library:** Custom (no shadcn/MUI/Radix) + Lucide icons
- **Router:** React Router DOM v7
- **State Management:** React Context (AuthContext, ToastContext)
- **Build Tool:** Vite 6
- **Animation:** motion (framer-motion successor) v12
- **Package Manager:** npm
- **Toast:** Custom Toast component (ToastContext)
- **Icon Library:** Lucide React

## Page Inventory
| Page | Route | File | Type | Score |
|------|-------|------|------|-------|
| Landing | / | src/pages/Landing.tsx | landing | pending |
| Sign In | /sign-in | src/pages/SignIn.tsx | auth | pending |
| Sign Up | /sign-up | src/pages/SignUp.tsx | auth | pending |
| Onboarding | /onboarding | src/pages/Onboarding.tsx | form | pending |
| Verify Email | /verify-email | src/pages/VerifyEmail.tsx | auth | pending |
| Dashboard | /dashboard | src/pages/Dashboard.tsx | list/dashboard | pending |
| Editor | /editor/:resumeId | src/pages/Editor.tsx | editor | pending |
| Settings | /settings | src/pages/Settings.tsx | settings | pending |
| Admin | /admin | src/pages/Admin.tsx | admin | pending |
| Public Profile | /:username | src/pages/PublicProfile.tsx | detail | pending |
| API Docs | /docs | src/pages/ApiDocs.tsx | docs | pending |
| Agent Guide | /agents | src/pages/AgentGuide.tsx | docs | pending |
| Privacy | /privacy | src/pages/Privacy.tsx | static | pending |
| Terms | /terms | src/pages/Terms.tsx | static | pending |

## Navigation Structure
- Per-page inline navbars (no shared sidebar/shell)
- LandingNav: logo + anchor links + sign-in/CTA
- DashboardNav: logo + "My Resumes" label + kebab menu
- SettingsNav: logo + "Settings" label + kebab menu
- AppNav (Editor): logo + editable title + Share + Export PDF + kebab menu
- EditorLayout tabs: Source | Design | AI (desktop); Edit | Design | Preview | AI (mobile)
- AIToolsPanel tabs: Polish | Job Match | Import
- No breadcrumbs anywhere

## Existing UX Patterns
- **Empty states:** Dashboard (solid), PublicProfile 404 (solid). Others: N/A or absent
- **Loading states:** Editor (detailed skeleton), Dashboard (3 skeleton cards), PublicProfile (skeleton), Admin (pulse skeleton). Auth: minimal
- **Help text:** Onboarding (live URL preview, availability), Settings (redirect note), Editor (recovery banner, save status). Most pages: absent
- **Metrics:** Dashboard (view counts), Admin (model pricing). No user-facing KPIs
- **Toasts:** Custom Toast component. Inconsistent usage -- Editor/Settings/Admin use both success+error; Dashboard errors only
- **Confirmation dialogs:** Resume delete (ResumeCard), template reset (DesignPanel). No confirm on destructive account actions
- **Progress indicators:** VerifyEmail (resend countdown), Onboarding (availability check). No step indicators anywhere
- **Error handling:** ErrorBoundary wraps Editor, Dashboard, Settings, PublicProfile. Generic "Something went wrong" fallback

## Workflow Map

### Workflow 1: First-time user setup — Bumpy
Path: Landing -> Sign Up -> Onboarding -> [Verify Email] -> Dashboard (empty) -> Create Resume -> Editor
Dependencies: none
Gaps:
- [WF-001] Missing handoff at Sign Up -> Onboarding: No visible success confirmation after email signup; user is silently redirected to onboarding with no "account created" feedback. Verification email sent in background with no notice.
- [WF-002] Dead end at Dashboard (empty) -> Editor: After creating first resume with "custom" starter, editor loads blank with no placeholder content, no guidance on markdown syntax or section structure.
- [WF-003] Unclear sequence at Editor (first visit): Three tabs (Source/Design/AI) shown with equal weight; new user doesn't know whether to write first, pick a template first, or import an existing resume.

### Workflow 2: Create and edit a resume — Bumpy
Path: Dashboard -> Create Modal -> Editor -> (write/design/AI) -> Export PDF
Dependencies: requires Workflow 1 (account setup)
Gaps:
- [WF-004] Dead end at Editor (new blank resume): No starter guidance, no placeholder markdown, no "start here" prompt for custom starter selection.
- [WF-005] Missing handoff at Editor -> next steps: After writing content, no guidance to try Design tab, AI polish, or export. User must discover features independently.

### Workflow 3: AI bullet polish — Bumpy
Path: Editor -> AI tab -> Polish subtab -> select/edit bullets -> get polished result
Dependencies: requires resume with bullet points (- or * markdown)
Gaps:
- [WF-006] Hidden prerequisite at Polish tab: If no bullets exist, shows "No bullet points found" with no link back to editor or example of how to add bullets.
- [WF-007] Broken feedback loop at Polish tab: After polishing, user needs to manually copy results back. No "apply to resume" integration described.

### Workflow 4: Job match scoring — Smooth
Path: Editor -> AI tab -> Job Match -> paste URL or description -> get score
Dependencies: requires resume content
Gaps: None significant. Clear inputs and CTAs. Score history available.

### Workflow 5: Export to PDF — Smooth
Path: Editor -> Export PDF button -> download
Dependencies: requires Pro subscription for PDF export
Gaps: None significant. Free users see UpgradeModal with clear pricing. Pro users get direct download.

### Workflow 6: Manage subscription — Smooth
Path: Settings -> Subscription card -> Stripe Checkout -> return to Settings
Dependencies: none (available from Settings)
Gaps: None significant. Well-handled with success banner + polling on return.

### Workflow 7: Set up public profile — Bumpy
Path: Onboarding (username) -> Dashboard -> set default resume -> /:username
Dependencies: requires Workflow 1 (username), requires at least 1 resume
Gaps:
- [WF-008] Hidden prerequisite at Public Profile: User claims username in onboarding but profile page returns 404 until a default resume is set. No guidance anywhere that a default resume is needed.
- [WF-009] Broken feedback loop at Public Profile (no default): Same 404 shown for "username not claimed" and "no default resume set." Copy says "hasn't been claimed yet" which is factually incorrect. Profile owner gets no useful error or fix action.

### Workflow 8: View/restore version history — Bumpy
Path: Editor -> kebab menu -> Version History panel -> select version -> restore
Dependencies: requires Pro subscription, requires saved versions to exist
Gaps:
- [WF-010] Missing handoff at Editor: Version history is buried in the kebab overflow menu with no visual indicator. Users must discover it exists.

### Workflow 9: Delete a resume — Smooth
Path: Dashboard -> Resume Card kebab -> Delete -> Confirm Modal -> removed
Dependencies: none
Gaps: None. Has confirmation dialog with clear consequences.

### Workflow 10: Import existing resume — Bumpy
Path: Editor -> AI tab -> Import subtab -> paste text -> Convert to Markdown
Dependencies: requires Pro subscription
Gaps:
- [WF-011] Unclear sequence at Import tab: Should user import before writing from scratch? No guidance on when to use Import vs. writing fresh. No sample input showing expected format.

## Workflow Gap Summary

| ID | Gap Type | Severity | Workflow | Location |
|----|----------|----------|----------|----------|
| WF-001 | Missing handoff | High | First-time setup | Sign Up -> Onboarding |
| WF-002 | Dead end | Critical | First-time setup | Editor (blank resume) |
| WF-003 | Unclear sequence | High | First-time setup | Editor tabs |
| WF-004 | Dead end | Critical | Create resume | Editor (custom starter) |
| WF-005 | Missing handoff | High | Create resume | Editor -> next steps |
| WF-006 | Hidden prerequisite | High | AI polish | Polish tab (no bullets) |
| WF-007 | Broken feedback loop | Medium | AI polish | Polish results -> resume |
| WF-008 | Hidden prerequisite | Critical | Public profile | Profile without default resume |
| WF-009 | Broken feedback loop | Critical | Public profile | Profile 404 for owned username |
| WF-010 | Missing handoff | Medium | Version history | Editor kebab menu |
| WF-011 | Unclear sequence | Medium | Import resume | Import tab guidance |

## Cross-Workflow Dependencies
- Subscription -> gates PDF export, AI tools, version history, 3+ resume variants, template access, custom QR, branding removal
- Onboarding (username) -> gates public profile
- Default resume flag -> gates public profile content (but this dependency is invisible to the user)
- Resume with bullet points -> gates AI polish (dependency is invisible until user tries)
