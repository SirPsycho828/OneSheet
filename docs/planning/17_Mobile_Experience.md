▸ Extended thinking (339 chars)  
## Overview

BragSheet is a responsive web app, not a native mobile app. The mobile experience is optimized for two scenarios: editing resume content on-the-go (phone/tablet) and sharing the public profile link (recipients view on mobile). No native app, no PWA install prompt, no offline mode. The desktop editor is the primary authoring surface; mobile is secondary but must be functional.

## Dependencies

- `04_Editor.md` -- Markdown editor must be usable on mobile
- `05_Landing_Page.md` -- Landing page must be responsive
- `10_Public_Profiles.md` -- Public profiles are frequently viewed on mobile
- `11_Dashboard.md` -- Dashboard must be navigable on mobile
- `06_Live_Preview.md` -- Preview behavior changes on mobile
- `08_Template_System.md` -- Templates must render correctly at mobile viewport widths

## Responsive Breakpoints

Using Tailwind's default breakpoint system:

| Breakpoint | Width | Target |
|------------|-------|--------|
| Default | < 640px | Phone (portrait) |
| `sm` | ≥ 640px | Phone (landscape), small tablet |
| `md` | ≥ 768px | Tablet (portrait) |
| `lg` | ≥ 1024px | Tablet (landscape), small laptop |
| `xl` | ≥ 1280px | Desktop |

The critical split: below `md` (768px) is the "mobile layout" where side-by-side panels collapse to stacked/tabbed views.

## Editor on Mobile

### Layout Change

Desktop editor is a two-panel split: markdown on the left, live preview on the right (see `04_Editor.md`). On mobile (< 768px), this becomes a tabbed interface:

- Two tabs at the top: "Edit" | "Preview"
- Only one panel visible at a time
- Active tab is indicated with an underline/highlight
- Switching tabs is instant (no network request, just showing/hiding the rendered content)

### Tab Behavior

| Tab | Content |
|-----|---------|
| Edit | Full-height textarea with markdown content. Toolbar above it (simplified -- see below) |
| Preview | Rendered resume preview, scrollable, same output as desktop preview |

Default tab on page load: "Edit" (the user came here to write).

### Simplified Toolbar

The desktop toolbar (see `04_Editor.md`) has formatting buttons. On mobile, reduce to essentials:

**Show on mobile**: Bold, Italic, Link, Heading (dropdown), Undo, Redo
**Hide on mobile**: Any buttons that duplicate keyboard shortcuts most mobile users won't use

Toolbar uses `overflow-x-auto` with horizontal scroll if all buttons don't fit, rather than wrapping to a second row.

### Textarea Behavior

- `font-size: 16px` minimum (prevents iOS zoom-on-focus)
- Full viewport width minus padding
- Auto-growing height (no fixed height with internal scroll on mobile -- scroll the page instead)
- `autocapitalize="sentences"` for natural mobile typing
- `autocorrect="on"` -- let mobile keyboards help with prose
- `spellcheck="true"`

### Save Behavior

Same auto-save as desktop (debounced, saves on blur). On mobile, also save when the user switches from Edit tab to Preview tab (treat tab switch as an intent boundary).

## Dashboard on Mobile

### Layout

Desktop dashboard shows resume cards in a grid (see `11_Dashboard.md`). On mobile:

- Single-column stack of cards
- Each card shows: title, template name, "Default" badge if applicable, analytics line (paid), last edited timestamp
- Card actions (edit, duplicate, delete, set default) behind a `...` overflow menu rather than always-visible buttons
- "New Resume" button fixed at bottom of screen or as a FAB (floating action button) in bottom-right

### Navigation

Desktop has a sidebar or top nav. On mobile:

- Hamburger menu (top-left) or bottom tab bar
- Bottom tab bar preferred for thumb reachability: Dashboard | Editor | Settings
- If using hamburger: slide-out drawer with navigation links

Recommendation: bottom tab bar with 3 items. Keeps primary actions within thumb zone.

## Public Profile on Mobile

Public profiles are the most-viewed mobile surface. When a user shares their BragSheet link on LinkedIn or via text, the recipient likely opens it on their phone.

### Rendering

- Resume content renders at full viewport width with appropriate padding (16px sides)
- Typography scales down gracefully (body text at 14-15px, headings proportionally)
- Long lines wrap naturally -- no horizontal scroll
- Tables in resume markdown become horizontally scrollable within their container
- Code blocks use `overflow-x-auto` with horizontal scroll

### Template Responsiveness

Each template (see `08_Template_System.md`) must define mobile-specific styles:

| Element | Desktop | Mobile |
|---------|---------|--------|
| Name/title | Large (2-3rem) | Scaled down (1.5-2rem) |
| Multi-column sections | Side-by-side | Stacked vertically |
| Margins | Generous (simulates paper) | Minimal (maximize content area) |
| Contact info row | Horizontal, separated by pipes/dots | Wrap to 2 lines if needed |

Templates use CSS `@media` queries or Tailwind responsive classes within their style definitions.

### Paper Simulation

Desktop preview shows the resume on a simulated paper sheet with shadow and margins. On mobile profile view:

- No paper simulation (no shadow, no constrained width)
- Content fills the viewport naturally
- Background is white (or template-appropriate) edge-to-edge
- This is intentional -- a tiny paper rectangle on a phone screen is unreadable

## Landing Page on Mobile

See `05_Landing_Page.md` for full landing page spec. Mobile-specific concerns:

- Hero section: stack headline and CTA vertically, reduce headline font size
- Feature grid: single column instead of 2-3 columns
- Screenshots/mockups: full-width, reduced height, swipeable carousel if multiple
- CTA buttons: full-width on mobile (`w-full` below `sm` breakpoint)
- Navigation: hamburger menu or minimal top bar with "Sign In" + "Get Started"

## Settings on Mobile

Settings page (subscription management, API keys, profile settings):

- Single-column form layout (already natural for settings)
- API key table becomes a card list (each key as a stacked card showing name, prefix, dates, actions)
- "Generate API Key" modal: full-screen on mobile (not a centered overlay)
- Stripe Customer Portal redirect works identically (Stripe's portal is already mobile-responsive)

## Touch Interactions

### Targets

All interactive elements meet minimum touch target size:

- Buttons: minimum 44x44px tap area (Apple HIG standard)
- Links in navigation: minimum 44px height with adequate spacing
- Toolbar buttons: 40x40px minimum with 4px gaps
- Card tap areas: entire card is tappable for primary action (navigate to editor)

### Gestures

No custom gestures at MVP. Standard browser behaviors only:

- Scroll: native vertical scroll everywhere
- Pinch-to-zoom: NOT disabled (users may want to zoom the preview)
- Swipe: no swipe navigation between tabs (tap only -- avoids conflict with system back gesture)
- Long-press: no custom long-press menus

### Viewport Meta

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

- `viewport-fit=cover`: extends into safe areas on notched phones
- Do NOT include `maximum-scale=1` or `user-scalable=no` -- accessibility violation
- Use `env(safe-area-inset-bottom)` padding on fixed bottom elements (tab bar, FAB)

## Performance on Mobile

### Critical Considerations

- Editor page: load the textarea and toolbar immediately. Defer preview rendering until the Preview tab is tapped.
- Dashboard: lazy-load analytics data after initial card render
- Public profile: server-rendered HTML (or at minimum, fast SSR/SSG) -- visitors should see content within 1 second on 4G
- Images: if profile photos are added later, use `srcset` and WebP with fallback

### Bundle Impact

No mobile-specific code splitting at MVP. The editor tab toggle is a trivial conditional render, not a separate route. If bundle size becomes an issue, the preview renderer (markdown-to-HTML + template styles) is the largest chunk and could be lazy-loaded per tab.

## Onboarding on Mobile

The onboarding flow (see `07_Onboarding.md`) must work on mobile:

- Username selection: single input, full-width, with availability indicator
- Template selection: horizontally scrollable row of template thumbnails, or vertical list with previews
- Initial markdown paste/type: full-width textarea, same 16px font-size rule
- Step indicators: compact dots or progress bar at top, not a wide stepper

## PDF Export on Mobile

PDF export (see `09_PDF_Export.md`) works identically on mobile -- it's a server-side operation. The generated PDF downloads normally via the browser's download mechanism. On iOS Safari, the PDF opens in-browser (Safari's built-in PDF viewer). On Android Chrome, it downloads to the Downloads folder.

No special mobile handling needed. The "Export PDF" button triggers the same API call regardless of device.

## What BragSheet Does NOT Do on Mobile

- **No native app**: Web only. No App Store/Play Store presence.
- **No PWA**: No service worker, no install prompt, no offline mode. Resume editing requires an internet connection for auto-save. Offline editing introduces sync conflicts that are out of scope.
- **No push notifications**: No mobile notifications for profile views or any other event.
- **No camera/photo integration**: No profile photo feature at MVP, so no camera access needed.
- **No mobile-specific features**: No "share to LinkedIn" button, no QR code generator for the profile URL. These are post-MVP enhancements (see `19_Future_Features.md`).

## Gaps & Assumptions

- **No mobile-first design**: Desktop is the primary design target. Mobile is "must work well" not "optimized first." The markdown editor is inherently a desktop-friendly interaction -- typing long-form content on a phone keyboard is possible but not ideal. Mobile is expected to be used for quick edits, not full resume authoring sessions.
- **No tablet-specific layouts**: Tablets get the desktop layout (side-by-side editor) at `md` breakpoint and above. No iPad-optimized layout with different proportions. The standard responsive breakpoints handle tablets adequately.
- **iOS Safari quirks**: Safari has known issues with `100vh` (includes URL bar), fixed positioning during keyboard open, and rubber-band scrolling. Use `dvh` (dynamic viewport height) where supported with `vh` fallback. Test keyboard behavior on the editor textarea -- Safari may push content under fixed headers when the keyboard opens.
- **Mobile testing**: No automated mobile viewport testing at MVP. Manual testing on iPhone Safari and Android Chrome covers the two dominant mobile browsers. Playwright's device emulation can supplement but doesn't catch real device issues (keyboard behavior, safe areas, scroll momentum).
- **Accessibility on mobile**: Screen reader support (VoiceOver on iOS, TalkBack on Android) is not explicitly tested at MVP but is supported by using semantic HTML, proper ARIA labels, and logical focus order. The tabbed editor interface must announce tab switches to assistive technology.  
