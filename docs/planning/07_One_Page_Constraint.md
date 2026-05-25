## Overview

The one-page constraint is BragSheet's core product opinion. Every resume must fit on a single page. When content overflows, the system responds with a visual warning and automatic font scaling to fit. This is not a suggestion -- it is the defining behavior of the product. The constraint applies to both the live preview and PDF export.

## Dependencies

- `06_Markdown_Editor.md` -- Overflow detection triggers after each render
- `04_UI_Design_System.md` -- Warning bar colors and styles
- `09_PDF_Export.md` -- PDF rendering must apply the same scale factor
- `02_Database_Schema.md` -- `resumes.overflow` map stores constraint state

## Constraint Philosophy

The PRD evaluated three approaches:

| Option | Behavior | Chosen |
|--------|----------|--------|
| Visual warning + auto-scale | Warn and shrink to fit | Yes |
| Hard block | Prevent PDF export if overflowing | No |
| Warning only | Warn but allow multi-page export | No |

Auto-scale with warning was chosen because it respects the one-page promise while not frustrating users mid-editing. The system does the work of fitting content; the user sees feedback about it.

## Measurement System

### How Overflow Is Detected

After each preview render (debounced at 150ms per `06_Markdown_Editor.md`):

1. Render the resume HTML into a hidden measurement container
2. The measurement container matches exact paper dimensions at full scale (no CSS transform)
3. Compare the content's `scrollHeight` against the container's `clientHeight`
4. If `scrollHeight > clientHeight`, content is overflowing

### Measurement Container Setup

- Off-screen div (`position: absolute; left: -9999px; top: 0`)
- Exact paper dimensions: US Letter 816x1056px or A4 794x1123px (at 96 DPI)
- Same padding as the paper preview: `padding: 48px` (0.5" margins)
- Same template styles applied (font family, sizes, spacing from active template)
- `visibility: hidden` but NOT `display: none` (display none prevents height calculation)
- No CSS `transform` on this container -- it must be at 1:1 scale for accurate measurement

The visible preview panel uses `transform: scale()` to fit the panel width, but measurement always happens at true paper size.

### Measurement Timing

```
User types
  -> 150ms debounce
  -> remark renders markdown to HTML
  -> HTML injected into measurement container (scale = 1.0)
  -> scrollHeight vs clientHeight compared
  -> If overflowing: binary search for scaleFactor
  -> overflow state updated on resume document
  -> Visible preview applies scaleFactor
  -> Warning bar shown/hidden
```

## Auto-Scale Behavior

### Scale Factor Calculation

When content overflows at `scale = 1.0`, find the smallest scale factor that fits:

1. Start with `scaleFactor = 1.0`
2. If overflowing, try `0.95`, then `0.90`, and so on in `0.05` decrements
3. At each step, apply the scale to the measurement container via `transform: scale(X)` on the content wrapper (not the container itself -- container stays at paper size, content inside scales)
4. Re-check `scrollHeight` against `clientHeight`
5. Stop at the first factor where content fits

**Scale floor**: `0.75` (equivalent to reducing 12pt body text to 9pt). Below this, text becomes unreadable and the constraint has a different answer: the user must trim content.

**Scale increments**: `0.05` steps are sufficient. Finer granularity (0.01) adds compute cost without visible benefit. Six checks maximum (1.0, 0.95, 0.90, 0.85, 0.80, 0.75).

### How Scaling Is Applied

Scaling applies to the content inside the paper container, not the container itself:

```
Paper container (fixed at 816x1056 or 794x1123)
  -> Content wrapper (transform: scale(scaleFactor), transform-origin: top left)
    -> Rendered resume HTML
```

The content wrapper's width is set to `100% / scaleFactor` so that scaled content still fills the paper width. This prevents horizontal gaps when scaling down.

### What Scales

Everything inside the paper container scales uniformly:
- Font sizes
- Line heights
- Margins and padding between sections
- List item spacing
- Table cell padding

The paper container, paper margins (48px padding), and paper shadow do NOT scale.

## State Management

### Resume Document Fields

The `overflow` map on the `resumes` document (see `02_Database_Schema.md`):

| Field | Type | Updated When |
|-------|------|-------------|
| `isOverflowing` | `boolean` | Every measurement cycle |
| `scaleFactor` | `number` | Every measurement cycle. `1.0` when not overflowing |

These values are saved as part of the auto-save debounce (2 seconds after last keystroke). They are NOT saved on every measurement -- only when the auto-save fires.

### Local State vs Persisted State

- `scaleFactor` is calculated locally on every render for instant preview feedback
- The persisted value in Firestore is used by the PDF export endpoint (see `09_PDF_Export.md`) so server-side rendering matches the client preview
- If the client and server calculate slightly different values due to font rendering differences, the persisted client value takes precedence

## Warning Bar

### States

| Condition | Bar Color | Message |
|-----------|-----------|---------|
| `scaleFactor === 1.0` | Hidden | -- |
| `0.75 < scaleFactor < 1.0` | `warning` (amber) | "Content exceeds one page. Auto-scaled to {X}%." |
| `scaleFactor === 0.75` | `error` (red) | "Maximum scaling reached. Trim content to fit one page." |

`{X}%` displays the scale factor as a percentage: `scaleFactor * 100`, rounded to nearest integer. Example: "Auto-scaled to 85%."

### Bar Placement

- Fixed position above the preview panel, below the editor nav
- Full width of the preview panel only (not the markdown input panel)
- `py-2 px-4 text-sm font-medium`
- Includes a dismiss button (X), but the bar reappears on next measurement if still overflowing
- Amber bar includes link text: "Trim content" -- does nothing functional, just serves as a nudge

### Transition

- Bar slides in from top with `duration-200` when overflow is detected
- Bar disappears instantly when content no longer overflows (no exit animation -- immediate positive feedback)

## PDF Export Consistency

The PDF export endpoint (`POST /api/pdf/generate` in `03_API_Endpoints.md`) must produce the same layout as the client preview:

1. Server reads `overflow.scaleFactor` from the resume document
2. Applies the same scale transform when rendering HTML for Puppeteer
3. Uses the same paper dimensions, margins, and template styles
4. If `scaleFactor` is stale (e.g., user changed content but hasn't saved), the server re-calculates by measuring rendered content height against paper height in the Puppeteer viewport

Template CSS must be identical between client preview and server render. Extract shared template styles into standalone CSS files that both environments consume. See `08_Template_System.md`.

## Template Interaction

Different templates have different content density:

- A template with larger heading sizes and more section padding overflows sooner
- A compact template fits more content before triggering scaling
- When a user switches templates, overflow detection re-runs immediately
- The scale factor is per-resume, not per-template -- switching templates recalculates

Template designers must ensure their styles work acceptably at `0.75` scale. Minimum readable size at any template's base font size times `0.75` should be at least 9px.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty resume | No overflow. `scaleFactor = 1.0`. No warning bar. |
| Content exactly fills one page | `isOverflowing = false`, `scaleFactor = 1.0`. No warning. |
| Content overflows by 1 pixel | Overflow detected. Scale to `0.95` (first step). Warning shown. |
| User pastes massive content | Scale iterates down to `0.75`. Error-level warning. User must trim. |
| User deletes content below threshold | Overflow clears. Warning disappears instantly. `scaleFactor` resets to `1.0`. |
| Template switch causes overflow | Re-measure. New scale factor applied. Warning shown if needed. |
| Template switch clears overflow | Re-measure. Scale resets to `1.0`. Warning clears. |
| Browser zoom | Measurement container uses fixed pixel dimensions, not viewport-relative. Browser zoom doesn't affect overflow detection. |

## Gaps & Assumptions

- **Font rendering differences**: Client (browser) and server (Puppeteer in Cloud Functions) may render fonts at slightly different metrics. Both use the same Google Fonts, but hinting and anti-aliasing can cause 1-2px variation. The persisted `scaleFactor` from the client is used server-side to avoid mismatches. If the server renders with the client's factor and content still overflows by a pixel, Puppeteer's `@page` CSS and `overflow: hidden` ensure the PDF never bleeds to page two.
- **Performance**: Six measurement iterations (worst case) each requiring DOM layout calculation. On modern hardware this takes < 50ms total. If profiling shows this is slow, cache the last-known scale factor and only re-measure when `markdown` or `templateId` changes.
- **Paper size switching**: Changing between US Letter and A4 triggers re-measurement. A4 is taller and narrower, so content that fits on US Letter might need different scaling on A4 (or vice versa).
- **Print from browser**: If a user tries to print the page via `Ctrl+P`, they get the app chrome. Browser print is not supported -- PDF export is the path. No `@media print` styles at MVP.  
