▸ Extended thinking (1099 chars)  
## Overview

BragSheet's design language reflects its core philosophy: constraint as a feature. The UI is clean, minimal, and typographically focused. No decorative elements, no gradients, no visual noise. The product should feel like a well-crafted developer tool -- precise, fast, and opinionated. Built with Tailwind CSS.

## Dependencies

- `05_Landing_Page.md` -- Applies design tokens to marketing page
- `06_Markdown_Editor.md` -- Editor-specific layout and typography
- `08_Template_System.md` -- Resume templates are separate from app UI; they have their own type system

## Design Principles

1. **The resume is the hero** -- App chrome stays minimal so the preview dominates
2. **Monochrome with one accent** -- Grayscale palette with a single brand color for CTAs and active states
3. **Typography-first** -- Type hierarchy does the heavy lifting; minimal use of borders, shadows, and color fills
4. **No dark mode at MVP** -- The app previews resumes on white paper. A dark app shell around a white preview creates jarring contrast. Ship light mode only; revisit if users request dark mode.

## Colors

### Brand Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-500` | `#2563EB` | Primary CTA buttons, active states, links |
| `brand-600` | `#1D4ED8` | Hover state for primary buttons |
| `brand-700` | `#1E40AF` | Active/pressed state |
| `brand-50` | `#EFF6FF` | Subtle brand backgrounds (selected template border, active tab) |

### Neutral Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `gray-950` | `#0C0A09` | Primary text |
| `gray-700` | `#44403C` | Secondary text, labels |
| `gray-500` | `#78716C` | Placeholder text, disabled states |
| `gray-300` | `#D6D3D1` | Borders |
| `gray-100` | `#F5F5F4` | Background surfaces (sidebar, header) |
| `gray-50` | `#FAFAF9` | Page background |
| `white` | `#FFFFFF` | Cards, resume preview surface, inputs |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#16A34A` | Save confirmations, success toasts |
| `warning` | `#D97706` | Overflow warning indicator |
| `error` | `#DC2626` | Form validation errors, error toasts |

## Typography

### App UI Fonts

| Element | Font | Size | Weight | Tracking |
|---------|------|------|--------|----------|
| Page headings | Inter | 24px / `text-2xl` | 600 | `-0.025em` |
| Section headings | Inter | 18px / `text-lg` | 600 | `-0.015em` |
| Body text | Inter | 14px / `text-sm` | 400 | Normal |
| Small / captions | Inter | 12px / `text-xs` | 400 | Normal |
| Code / markdown input | JetBrains Mono | 14px / `text-sm` | 400 | Normal |
| Buttons | Inter | 14px / `text-sm` | 500 | Normal |

Load Inter (400, 500, 600) and JetBrains Mono (400) from Google Fonts. Two families only -- no additional weights or styles.

### Resume Template Fonts

Resume templates use their own font stacks independent of the app UI. See `08_Template_System.md`. Templates may use serif fonts (e.g., Crimson Text), but the app shell always uses Inter.

## Spacing and Layout

- Base unit: 4px (Tailwind default)
- Page padding: `p-6` (24px) on desktop, `p-4` (16px) on mobile
- Card padding: `p-4` to `p-6`
- Section gaps: `gap-6` between major sections, `gap-3` between form fields
- Max content width: `max-w-7xl` (1280px) for the app shell, centered

### Editor Layout

The editor page is a two-panel split:

| Panel | Width | Content |
|-------|-------|---------|
| Left: Editor | `w-1/2` or resizable | Markdown textarea with JetBrains Mono |
| Right: Preview | `w-1/2` or resizable | Paper-sized resume preview, centered in panel |

On screens below `lg` (1024px), stack vertically with a tab switcher between Edit and Preview. See `17_Mobile_Experience.md`.

## Component Patterns

### Buttons

| Variant | Style |
|---------|-------|
| Primary | `bg-brand-500 text-white` rounded-md, `hover:bg-brand-600`, `h-9 px-4` |
| Secondary | `bg-white border border-gray-300 text-gray-700`, `hover:bg-gray-50`, same sizing |
| Ghost | No background or border, `text-gray-700`, `hover:bg-gray-100` |
| Danger | `bg-error text-white`, used only for destructive actions with confirmation |

All buttons: `text-sm font-medium`, `rounded-md`, `transition-colors`, disabled state at 50% opacity with `cursor-not-allowed`.

### Form Inputs

- `h-9 px-3 text-sm rounded-md border border-gray-300`
- Focus: `ring-2 ring-brand-500 ring-offset-1 border-transparent`
- Error: `border-error` with error message in `text-xs text-error` below
- Labels: `text-sm font-medium text-gray-700 mb-1.5`

### Cards

- `bg-white rounded-lg border border-gray-300 p-4`
- No shadows at rest. `shadow-sm` on hover only where cards are interactive (e.g., template picker)
- Used for: template picker items, dashboard resume cards, settings sections

### Toasts

- Position: bottom-right, stacked
- Width: `max-w-sm`
- Variants: success (green left border), error (red left border), info (blue left border)
- Auto-dismiss: 4 seconds for success/info, persistent for errors until dismissed
- See `18_Error_Handling_Saves.md` for toast trigger conditions

### Paper Preview

The resume preview renders inside a container that matches real paper dimensions:

| Paper Size | Dimensions (px at 96 DPI) | Aspect Ratio |
|------------|---------------------------|--------------|
| US Letter | 816 x 1056 | 1 : 1.294 |
| A4 | 794 x 1123 | 1 : 1.414 |

The preview container has:
- `bg-white` surface
- `shadow-lg` to distinguish from the app background
- Scaled to fit the available panel width using CSS `transform: scale()` while maintaining aspect ratio
- 1px `border-gray-200` at the edges

### Overflow Warning

When content exceeds one page (see `07_One_Page_Constraint.md`):
- A `warning`-colored bar appears above the preview: "Content exceeds one page. Auto-scaling applied (85%)."
- Shows current scale percentage
- Includes a text link: "Trim content to remove scaling"
- If scale factor hits the floor (0.75), bar turns `error`-colored: "Content too long even with maximum scaling."

## Iconography

Use Lucide React icons exclusively. 20px default size (`w-5 h-5`), `stroke-width: 1.5`. Match icon color to adjacent text color.

Common icons:
- Download/export: `Download`
- Settings: `Settings`
- Add/create: `Plus`
- Delete: `Trash2`
- External link: `ExternalLink`
- Editor: `Code`
- Preview: `Eye`
- Template: `Layout`
- Overflow warning: `AlertTriangle`

## Motion

- Transitions: `duration-150` for color/opacity changes, `duration-200` for layout shifts
- No spring animations, no bounce, no elaborate transitions
- Panel resize (editor/preview split): `duration-200 ease-out`
- Toast enter: slide in from right, `duration-200`
- Toast exit: fade out, `duration-150`
- Page transitions: none (instant route changes)

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `lg` (1024px+) | Full two-panel editor layout |
| `md` (768px-1023px) | Stacked editor with tab switcher (Edit/Preview) |
| `sm` (below 768px) | Simplified mobile view per `17_Mobile_Experience.md` |

## Gaps & Assumptions

- **Brand color choice**: `#2563EB` (Tailwind blue-600) is a placeholder. May be refined during implementation. The system is designed so changing the single brand hue propagates everywhere.
- **Font loading strategy**: Use `font-display: swap` for both Inter and JetBrains Mono. No FOUT mitigation beyond swap at MVP -- the app is text-heavy but not timing-sensitive on initial render.
- **Accessibility**: Target WCAG 2.1 AA. All color pairs listed above meet 4.5:1 contrast ratio for normal text. Focus rings on all interactive elements. Keyboard navigation for template picker and editor toolbar. Screen reader testing deferred to post-MVP.
- **Empty states**: Dashboard with no resumes, version history with no versions -- these need illustration or copy. Use simple text-based empty states at MVP ("No resumes yet. Create your first one.") with a primary CTA button. No illustrations.
- **Loading states**: Use skeleton placeholders (gray pulsing rectangles matching content layout) for resume loading and profile loading. Spinner only for PDF generation (indeterminate duration).  
