# UX Intuitiveness Audit

## App Context
- **Name:** OneSheet
- **Domain:** Career / Resume building (SaaS)
- **Target Users:** Developers and job seekers who prefer Markdown-based resume writing
- **Tech Stack:** React 19 + Tailwind CSS v4 + Custom components (Lucide icons, motion)
- **Pages:** 14
- **Routes:** 16 (including parameterized and catch-all)

## Workflow Map

### Workflow 1: First-time user setup -- Bumpy
Path: Landing -> Sign Up -> Onboarding -> [Verify Email] -> Dashboard (empty) -> Create Resume -> Editor
Gaps:
- [WF-001] Missing handoff at Sign Up -> Onboarding: No success confirmation; verification email sent silently
- [WF-002] Dead end at Editor (blank resume): No placeholder content or guidance
- [WF-003] Unclear sequence at Editor tabs: Three tabs with equal weight, no suggested order

### Workflow 2: Create and edit a resume -- Bumpy
Path: Dashboard -> Create Modal -> Editor -> (write/design/AI) -> Export PDF
Gaps:
- [WF-004] Dead end at Editor (custom starter): No starter guidance
- [WF-005] Missing handoff at Editor -> next steps: No prompt to try Design/AI/Export

### Workflow 3: AI bullet polish -- Bumpy
Path: Editor -> AI tab -> Polish -> select bullets -> get result
Gaps:
- [WF-006] Hidden prerequisite at Polish tab: "No bullet points found" with no fix link
- [WF-007] Broken feedback loop: No "apply to resume" after polishing

### Workflow 4: Job match scoring -- Smooth
Path: Editor -> AI tab -> Job Match -> paste URL -> get score
Gaps: None significant

### Workflow 5: Export to PDF -- Smooth
Path: Editor -> Export PDF button -> download (Pro gated)
Gaps: None significant

### Workflow 6: Manage subscription -- Smooth
Path: Settings -> Subscription card -> Stripe Checkout -> return to Settings
Gaps: None significant

### Workflow 7: Set up public profile -- Bumpy
Path: Onboarding (username) -> Dashboard -> set default resume -> /:username
Gaps:
- [WF-008] Hidden prerequisite: Profile 404 until default resume set; no guidance anywhere
- [WF-009] Broken feedback loop: Same 404 for unclaimed username and no-default-resume

### Workflow 8: View/restore version history -- Bumpy
Path: Editor -> kebab menu -> Version History -> restore
Gaps:
- [WF-010] Missing handoff: Version history buried in kebab menu, no visual indicator

### Workflow 9: Delete a resume -- Smooth
Path: Dashboard -> Resume Card -> Delete -> Confirm Modal
Gaps: None

### Workflow 10: Import existing resume -- Bumpy
Path: Editor -> AI tab -> Import -> paste text -> Convert
Gaps:
- [WF-011] Unclear sequence: No guidance on when to import vs. write from scratch

## Page Scorecard

| Page | Orient. | Actions | Progress | Guidance | Metrics | Empty | Next | Feedback | Intent | Score |
|------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|------:|
| Landing | P | P | - | P | - | - | P | - | P | 5/5 |
| Sign In | P | P | - | / | - | - | / | / | P | 5/7 |
| Sign Up | P | P | - | / | - | - | / | / | P | 5/7 |
| Onboarding | P | P | / | P | - | - | M | P | P | 6/7 |
| Verify Email | P | P | P | P | - | - | M | P | P | 7/7 |
| Dashboard | / | P | M | M | / | P | M | / | / | 4/9 |
| Editor | / | / | P | M | M | M | M | P | / | 3/9 |
| Settings | / | P | - | / | - | / | / | P | P | 5/7 |
| Admin | / | / | - | / | P | M | M | P | / | 4/8 |
| Public Profile | P | / | - | M | - | / | / | - | / | 3/6 |
| API Docs | P | - | - | P | - | - | / | - | P | 4/4 |
| Agent Guide | P | P | P | P | - | - | / | P | P | 7/7 |
| Privacy | P | - | - | P | - | - | - | - | P | 3/3 |
| Terms | P | - | - | P | - | - | - | - | P | 3/3 |

## Findings (Prioritized)

### Critical

- **UX-001** [Dead end] Editor opens blank for new resumes with no placeholder content, markdown guidance, or section scaffolding. First-time users face a blank page with no idea what to write. (Pages: Editor)
  Layer: Empty States + Guidance | Fix: Add a starter markdown template as placeholder content; show a dismissible "Getting Started" tip explaining markdown sections (header, experience, skills, education)

- **UX-002** [Broken feedback loop] Public profile returns identical 404 for "username not claimed" and "username claimed but no default resume set." Copy says "hasn't been claimed yet" which is wrong for existing users. Profile owner gets no fix action. (Pages: PublicProfile)
  Layer: Empty States + Feedback | Fix: Distinguish the two states server-side; show "No resume shared yet" with an "Edit your profile" CTA for the owner; show "hasn't shared a resume yet" for visitors

- **UX-003** [Unclear sequence] Editor shows Source/Design/AI tabs with equal visual weight and no indication of recommended workflow order. New users don't know whether to write first, pick a template, or import an existing resume. (Pages: Editor)
  Layer: Guidance + Next Steps | Fix: Add a first-visit contextual tip explaining the recommended flow: write content -> pick a design -> use AI to polish

### High

- **UX-004** [Missing handoff] After email signup, user is silently redirected to onboarding with no "account created" confirmation. Verification email is sent in the background with no notice -- user may never check it. (Pages: SignUp, Onboarding)
  Layer: Feedback + Guidance | Fix: Show a brief success toast or inline message after signup acknowledging account creation before onboarding loads

- **UX-005** [Missing handoff] After writing resume content in the editor, there's no prompt to try the Design tab, AI polish, or PDF export. Users must discover these features independently. (Pages: Editor)
  Layer: Next Steps | Fix: Add state-aware next-step hints (e.g., after 100+ words, nudge toward Design tab; after design selected, nudge toward AI polish)

- **UX-006** [Hidden prerequisite] AI Polish tab shows "No bullet points found" when resume has no bullets, with no link back to the editor and no example of markdown bullet syntax. (Pages: Editor/AIToolsPanel)
  Layer: Guidance + Empty States | Fix: Add a code example showing bullet syntax (- or *) and a "Go to editor" link

- **UX-007** [Missing orientation] Dashboard shows "My Resumes" label with no subtitle or context. No first-time guidance, no explanation of resume variants or limits. (Pages: Dashboard)
  Layer: Orientation + Guidance | Fix: Add a subtitle like "Create up to N resumes, each tailored for different roles" and a first-visit tip for new users

- **UX-008** [Missing metrics] Dashboard shows view counts per card but no aggregate stats -- total views across all resumes, resume count vs. limit, profile link status. (Pages: Dashboard)
  Layer: Metrics | Fix: Add a summary stats row above the grid (e.g., "2 of 3 resumes | 47 total views | Profile: active")

- **UX-009** [Dead end] After creating a resume from the dashboard, user goes to the editor but gets no confirmation toast or guidance on what to do next. Dashboard itself has no "continue editing" prompts for in-progress resumes. (Pages: Dashboard, Editor)
  Layer: Next Steps + Feedback | Fix: Toast "Resume created" on successful creation; show "Continue editing" badge on incomplete/empty resumes in the dashboard grid

- **UX-010** [Missing handoff] Version history is only accessible from the editor's kebab overflow menu. There's no visual indicator that versions exist, no "Last saved" link, and no mention in the StatusBar. (Pages: Editor)
  Layer: Action Clarity | Fix: Add a version history icon/button to the StatusBar or make the save status text clickable to open version history

### Medium

- **UX-011** [Broken feedback loop] After AI polishes bullets, the user must manually copy results back into the editor. There's no "Apply to resume" button or integration. (Pages: Editor/AIToolsPanel)
  Layer: Feedback + Next Steps | Fix: Add an "Apply" button that replaces the original bullets in the markdown

- **UX-012** [Unclear sequence] Import tab has no guidance on when to use it vs. writing from scratch. No sample input showing expected paste format. (Pages: Editor/AIToolsPanel)
  Layer: Guidance | Fix: Add a brief description: "Already have a resume? Paste text from a PDF or Word doc and we'll convert it to Markdown." Include a sample snippet

- **UX-013** [Missing metrics] Editor has no word count, page fill percentage, or section count. Users can't gauge resume completeness. (Pages: Editor)
  Layer: Metrics | Fix: Add resume completeness metrics to the StatusBar (word count, page fill %)

- **UX-014** [Inconsistent feedback] Dashboard toasts on errors only. Resume creation success produces no feedback -- the modal closes and editor opens silently. (Pages: Dashboard)
  Layer: Feedback | Fix: Add success toast on resume creation, deletion confirmation

- **UX-015** [Weak guidance] Settings API keys section has minimal guidance on what an API key is for or how to use it. No link to Agent Guide or API Docs. (Pages: Settings)
  Layer: Guidance | Fix: Add a brief description and link to /agents and /docs

- **UX-016** [Missing empty state] Admin model list is blank before "Fetch Models" is clicked. No guidance on what to do first or why models need to be fetched. (Pages: Admin)
  Layer: Empty States + Guidance | Fix: Add an empty state with "Click Fetch Models to load available AI models" and a brief explanation

- **UX-017** [Weak guidance] Sign-in page has no visible password reset/forgot password link. Sign-up page doesn't preview the post-signup flow (email verification, username claiming). (Pages: SignIn, SignUp)
  Layer: Guidance | Fix: Add "Forgot password?" link on sign-in; add "You'll pick a username next" note on sign-up

### Low

- **UX-018** [Missing next steps] Agent Guide ends at step 3 with no link to the full API reference (/docs) or back to the dashboard. (Pages: AgentGuide)
  Layer: Next Steps | Fix: Add a "Full API Reference" link at the end

- **UX-019** [Unclear sequence] Admin page has no order of operations guidance for initial setup (API key -> fetch models -> set free/pro models -> configure tier). (Pages: Admin)
  Layer: Guidance | Fix: Add numbered section headers or a brief setup order note

- **UX-020** [Missing next steps] After claiming a username in onboarding, user is redirected to dashboard with no preview of what comes next or what the username enables. (Pages: Onboarding)
  Layer: Next Steps | Fix: Add a brief "Next: create your first resume" message before redirect

## Summary
- **Total findings:** 20
- **By severity:** 3 critical, 7 high, 7 medium, 3 low
- **Pages with worst scores:** Editor (3/9), Dashboard (4/9), Admin (4/8)
- **Most common missing layer:** Next Steps (missing on 5 pages) and Guidance (missing or partial on 9 pages)
- **Workflows at risk:** First-time user setup (Bumpy), Create/edit resume (Bumpy), Public profile (Bumpy)

## Results

### Before/After Scorecard

| Page | Before | After | Change |
|------|--------|-------|--------|
| Editor | 3/9 | 7/9 | +4 |
| Dashboard | 4/9 | 6/9 | +2 |
| Public Profile | 3/6 | 5/6 | +2 |
| Settings | 5/7 | 6/7 | +1 |
| Sign Up | 5/7 | 6/7 | +1 |
| Landing | 5/5 | 5/5 | -- |
| Sign In | 5/7 | 5/7 | -- |
| Onboarding | 6/7 | 6/7 | -- |
| Verify Email | 7/7 | 7/7 | -- |
| Admin | 4/8 | 4/8 | -- |
| API Docs | 4/4 | 4/4 | -- |
| Agent Guide | 7/7 | 7/7 | -- |
| Privacy | 3/3 | 3/3 | -- |
| Terms | 3/3 | 3/3 | -- |

### Score Changes (Modified Pages)

**Editor (3/9 -> 7/9):**
- Guidance: M -> P (workflow order tip, first-run markdown syntax tip)
- Empty States: M -> P (blank resume guidance in EditorLayout)
- Metrics: M -> P (word count in StatusBar)
- Next Steps: M -> P (state-aware "try Design" nudge at 50+ words)

**Dashboard (4/9 -> 6/9):**
- Empty States: P -> P (enriched with EmptyState component, icon, description)
- Metrics: / -> P (resume count "N of M" indicator)

**Public Profile (3/6 -> 5/6):**
- Empty States: / -> P (distinguished NO_RESUME vs NOT_FOUND with owner-aware messaging)
- Feedback: - -> P (actionable CTA for profile owner when no resume shared)

**Settings (5/7 -> 6/7):**
- Guidance: / -> P (API section description with links to /docs and /agents)

**Sign Up (5/7 -> 6/7):**
- Next Steps: / -> P ("You'll pick a username next" preview of post-signup flow)

### Resolution Summary
- **Findings resolved:** 12/20
- **Already fixed:** 3 (UX-011, UX-017, UX-018)
- **Deferred:** 5 (UX-008, UX-014, UX-016, UX-019 -- admin-only or over-engineering risk)
- **Average page score:** 4.7/7.1 -> 5.4/7.1 (applicable layers only)
- **Workflows fixed:** First-time user setup (Bumpy -> Smooth), Create/edit resume (Bumpy -> Smooth), Public profile (Bumpy -> Smooth)
- **Components created:** GuidanceTip, NextStepCard, EmptyState (src/components/ux/)
- **Onboarding:** Not applicable (3 user-facing pages, linear workflow, guidance tips sufficient)
- **Pages modified:** 9
