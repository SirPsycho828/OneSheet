# Styling System & Resume Modal Redesign

## Overview

Two features that elevate OneSheet's editor from a template-based system to a full styling platform:

1. **Comprehensive Styling System** — A Design panel in the editor with presets, typography, color, layout, element, and page controls. All changes reflect live in the preview and persist identically in PDF exports.
2. **Improved New Resume Modal** — Redesigned dashboard modal with scaled resume thumbnails next to each starter template card.

---

## Feature 1: Styling System

### Data Model

The `templateId` and `paperSize` fields on the Resume document are superseded by a `styles` object. Existing resumes without a `styles` field default to `{ preset: resume.templateId, pageSize: resume.paperSize, ...PRESET_DEFAULTS[templateId] }`.

```typescript
interface ResumeStyles {
  // Which preset was the starting point
  preset: 'classic' | 'modern' | 'minimal' | 'technical' | 'compact';

  // Typography
  displayFont: string;    // Font for h1 (name)
  bodyFont: string;       // Font for body text
  fontSize: number;       // Base font size in px (11–16, step 0.5)
  lineHeight: number;     // Line height multiplier (1.2–1.8, step 0.1)

  // Color
  accentColor: string;    // Hex color for h2, accents, links

  // Layout
  headerAlignment: 'left' | 'center' | 'right';
  density: 'compact' | 'standard' | 'relaxed';
  sectionSpacing: 'tight' | 'normal' | 'relaxed';
  pageMargin: number;     // Inches: 0.5 | 0.65 | 0.75 | 1.0

  // Elements
  showHeaderDivider: boolean;
  showSectionDividers: boolean;
  bulletStyle: 'disc' | 'dash' | 'arrow' | 'square' | 'none';
  contactLayout: 'inline' | 'stacked' | 'icons';
  skillsDisplay: 'inline' | 'tags' | 'columns';
  dateAlignment: 'right' | 'inline';

  // Page
  pageSize: 'us-letter' | 'a4';
}
```

### Preset Definitions

Each preset is a complete `ResumeStyles` object that replaces the current template concept.

| Property | Classic | Modern | Minimal | Technical | Compact |
|---|---|---|---|---|---|
| displayFont | Crimson Text | Inter | Inter | JetBrains Mono | Inter |
| bodyFont | Crimson Text | Inter | Inter | JetBrains Mono | Inter |
| fontSize | 15 | 14 | 13 | 13 | 13 |
| lineHeight | 1.4 | 1.4 | 1.3 | 1.4 | 1.3 |
| accentColor | #000000 | #2563EB | #6B7280 | #000000 | #000000 |
| headerAlignment | center | left | left | left | left |
| density | standard | standard | compact | standard | compact |
| sectionSpacing | normal | normal | tight | normal | tight |
| pageMargin | 0.5 | 0.5 | 0.5 | 0.5 | 0.5 |
| showHeaderDivider | false | false | false | false | false |
| showSectionDividers | true | false | true | true | true |
| bulletStyle | disc | none | dash | arrow | disc |
| contactLayout | inline | inline | inline | inline | inline |
| skillsDisplay | inline | inline | inline | inline | inline |
| dateAlignment | inline | inline | inline | inline | inline |
| pageSize | us-letter | us-letter | us-letter | us-letter | us-letter |

### Available Fonts

Curated set of 9 fonts (3 already bundled as woff2, 6 new):

| Category | Fonts |
|---|---|
| Serif | Crimson Text (existing), Source Serif 4, Lora, Playfair Display |
| Sans-serif | Inter (existing), Source Sans 3, Montserrat, Raleway |
| Monospace | JetBrains Mono (existing) |

Each font requires woff2 files bundled in `functions/fonts/` for PDF generation, plus Google Fonts import for browser preview.

### Named Accent Colors

Nine named presets plus a custom hex color picker:

- Black `#000000`
- Slate `#475569`
- Charcoal `#374151`
- Navy `#1e3a5f`
- Royal Blue `#2563EB`
- Teal `#0d9488`
- Forest `#166534`
- Purple `#7c3aed`
- Burgundy `#7f1d1d`
- Custom (hex color picker)

### CSS Architecture

**Approach: CSS Custom Properties + data attributes for structural variants.**

All 5 template CSS files (`classic.css`, `modern.css`, `minimal.css`, `technical.css`, `compact.css`) are replaced by a single `resume.css` that uses CSS custom properties.

Custom properties set as inline styles on the template container element:

```css
--font-display: "Crimson Text", serif;
--font-body: "Crimson Text", serif;
--font-size-base: 15px;
--line-height: 1.4;
--accent-color: #000000;
--header-align: center;
--spacing-section: 16px;
--spacing-item: 4px;
--margin-page: 48px;
--header-divider: none;
--section-divider: 1px;
--bullet-style: disc;
```

The single resume stylesheet references these variables:

```css
.resume-content {
  font-family: var(--font-body);
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: #000;
}
.resume-content h1 {
  font-family: var(--font-display);
  font-size: calc(var(--font-size-base) * 1.6);
  text-align: var(--header-align);
}
.resume-content h2 {
  color: var(--accent-color);
  border-bottom: var(--section-divider) solid currentColor;
  margin-top: var(--spacing-section);
}
.resume-content li {
  list-style-type: var(--bullet-style);
}
```

Preset-specific structural CSS that cannot be expressed as variables uses data attributes:

```css
[data-preset="compact"] .resume-content { column-count: 2; column-gap: 24px; }
[data-preset="compact"] .resume-content > h1 { column-span: all; }
[data-preset="compact"] .resume-content > h1 + p { column-span: all; }
[data-preset="technical"] .resume-content li { list-style: none; }
[data-preset="technical"] .resume-content li::before { content: "> "; }
```

**Density and spacing mapping:**

| density | sectionSpacing | --spacing-section | --spacing-item |
|---|---|---|---|
| compact | tight | 8px | 2px |
| compact | normal | 10px | 2px |
| compact | relaxed | 12px | 3px |
| standard | tight | 12px | 3px |
| standard | normal | 16px | 4px |
| standard | relaxed | 20px | 5px |
| relaxed | tight | 16px | 4px |
| relaxed | normal | 20px | 6px |
| relaxed | relaxed | 24px | 8px |

**Page margin mapping:**

| pageMargin (inches) | --margin-page (px at 96 DPI) |
|---|---|
| 0.5 | 48px |
| 0.65 | 62px |
| 0.75 | 72px |
| 1.0 | 96px |

### HTML Post-Processing

Three style options require transforming the rendered HTML. A post-processor function runs after `renderMarkdown()` and before display/PDF generation.

Signature: `postProcessHtml(html: string, styles: ResumeStyles): string`

This function is used identically in the browser preview (`src/lib/`) and in Cloud Functions (`functions/src/lib/`), ensuring 1:1 parity between preview and PDF.

**1. Contact layout (`contactLayout`)**

Detects the first `<p>` after `<h1>` as the contact line. Splits on `|` or `·` separators.

- `inline`: no transformation
- `stacked`: wraps each segment in `<span class="contact-item">` with block display
- `icons`: pattern-matches each segment to detect type, prepends inline SVG from Lucide icon set:
  - Email pattern (`@`) → Mail icon
  - Phone pattern (`(`, `+`, digits) → Phone icon
  - URL pattern (`http`, `.com`, `.io`) → Globe icon
  - LinkedIn pattern → Linkedin icon
  - GitHub pattern → Github icon
  - Default (address) → MapPin icon

SVG icons are embedded as inline `<svg>` elements (not React components) so they work in both browser and Puppeteer PDF rendering. Icon paths are extracted from Lucide and stored as string constants.

**2. Skills display (`skillsDisplay`)**

Detects content under an `<h2>` whose text contains "skills" (case-insensitive). Looks for comma-separated text or `**Label:** items` patterns.

- `inline`: no transformation
- `tags`: wraps each skill in `<span class="skill-tag">` styled as rounded pills with subtle background
- `columns`: wraps the skills section content in `<div class="skills-columns">` with CSS `column-count: 2`

**3. Date alignment (`dateAlignment`)**

Detects date-like patterns in `<h3>` elements and nearby `<p>` elements: `Mon YYYY`, `YYYY - Present`, `MM/YYYY`, etc.

- `inline`: no transformation
- `right`: wraps detected dates in `<span class="date-right">` and uses flexbox on the parent to push dates to the right edge

### PDF Pipeline Changes

The `buildHtmlDocument()` function in `functions/src/lib/pdf.ts` is updated:

1. Accepts `styles: ResumeStyles` instead of just `templateId`
2. Generates inline CSS custom properties from the styles object
3. Uses the same single resume stylesheet instead of the `TEMPLATE_CSS` record
4. Applies `data-preset` attribute for structural variants
5. Runs the same `postProcessHtml()` on the rendered HTML
6. Font face block expanded to include all 9 fonts (woff2 files in `functions/fonts/`)

The `BuildHtmlParams` interface becomes:

```typescript
interface BuildHtmlParams {
  renderedHtml: string;
  styles: ResumeStyles;
  scaleFactor: number;
}
```

`paperSize` is no longer a separate param — it comes from `styles.pageSize`.

### Editor Integration

**Source/Design toggle** in the left panel header. Two tabs with the active tab underlined (reuses existing tab styling from mobile Edit/Preview switcher).

**Design panel sections (top to bottom, all collapsible):**

1. **Presets** — 3×2 grid of cards. Each card: preset name + one-line description. Selected card has a colored ring. Clicking a preset resets all values to that preset's defaults. If the user has customized any value away from the current preset's defaults, show a brief confirmation ("Reset all style options to [Preset] defaults?") before overwriting.

2. **Typography** — Display font dropdown (font name rendered in that font), body font dropdown (same), font size slider (11–16px), line height slider (1.2–1.8).

3. **Color** — Row of 9 named color circles plus a "custom" circle. Selected circle has a check mark. Custom opens a hex input.

4. **Layout** — Header alignment as 3 icon-buttons (left/center/right), density dropdown, section spacing dropdown, page margin dropdown.

5. **Elements** — Header divider toggle, section dividers toggle, bullet style dropdown (each option shows a visual preview), contact layout dropdown, skills display dropdown, date alignment dropdown.

6. **Page** — Page size dropdown, show page guides checkbox.

**Reset to preset** button at the bottom reverts all overrides.

All changes auto-save via the existing `useResume` hook's debounced save (1500ms). The `useResume` hook is extended to manage the `styles` object alongside `markdown`, `title`, etc.

### Backward Compatibility

Existing resumes in Firestore have `templateId` and `paperSize` but no `styles`. When loading a resume:

1. If `styles` exists, use it directly
2. If `styles` is missing, derive it: `{ preset: resume.templateId, pageSize: resume.paperSize, ...PRESET_DEFAULTS[resume.templateId] }`
3. On first save, the derived `styles` object is written to Firestore

The `templateId` and `paperSize` fields remain on the document for backward compatibility with any external consumers (API, public profile) but are no longer the source of truth for the editor. They are kept in sync when `styles` is saved.

### Components Affected

| Component | Change |
|---|---|
| `src/types/resume.ts` | Add `ResumeStyles` interface, add `styles?` field to `Resume` |
| `src/constants/templates.ts` | Replace template metadata with preset definitions |
| `src/constants/presets.ts` | New file: preset defaults, font list, color list |
| `src/styles/templates/*.css` | Remove all 5 files, replace with single `resume.css` |
| `src/styles/index.css` | Update imports, add new Google Fonts |
| `src/lib/markdown.ts` | Add `postProcessHtml()` function |
| `src/lib/styleUtils.ts` | New file: styles → CSS custom properties converter |
| `src/components/editor/DesignPanel.tsx` | New file: the full Design panel UI |
| `src/components/editor/EditorLayout.tsx` | Add Source/Design toggle, render DesignPanel |
| `src/components/editor/PaperContainer.tsx` | Apply CSS custom properties + data-preset from styles |
| `src/components/editor/MeasureContainer.tsx` | Same: apply CSS custom properties + data-preset |
| `src/components/editor/ResumePreview.tsx` | Pass styles to PaperContainer/MeasureContainer, run postProcessHtml |
| `src/hooks/useResume.ts` | Manage `styles` state, derive defaults for legacy resumes |
| `src/components/templates/TemplatePicker.tsx` | Remove — replaced by Design panel's Presets section |
| `src/components/templates/TemplateCard.tsx` | Remove — no longer needed |
| `src/components/dashboard/ResumeCard.tsx` | Apply styles as CSS custom properties for thumbnails |
| `src/components/profile/ProfileResume.tsx` | Apply styles as CSS custom properties |
| `functions/src/lib/pdf.ts` | Accept `ResumeStyles`, generate CSS vars, use single stylesheet |
| `functions/src/lib/markdown.ts` | Add server-side `postProcessHtml()` (shared logic) |
| `functions/src/routes/pdf.ts` | Pass `styles` from resume doc to `buildHtmlDocument` |
| `functions/src/routes/profile.ts` | Pass `styles` for public profile rendering |

---

## Feature 2: Improved New Resume Modal

### Changes to CreateResumeModal

The modal keeps its two-step wizard flow but with a visual upgrade to step 1.

**Step 1 — Template selection:**

- 2-column grid on desktop, 1-column on mobile
- Each card is a horizontal layout: scaled resume thumbnail on the left (~120px wide), template name + description on the right
- Thumbnails render the starter markdown with the Classic preset applied using the same approach as `ResumeCard` thumbnails (renderMarkdown + dangerouslySetInnerHTML + CSS transform scale)
- The "Custom" card shows a blank page with dashed border and a centered `+` icon
- Hover: subtle border color shift + shadow lift
- Clicking proceeds to step 2

**Step 2 — Title input:** No changes. Pre-fills with template label (except Custom).

**New resumes:** Created with `styles: PRESET_DEFAULTS['classic']` instead of `templateId: 'classic'`. The `templateId` field is still written for backward compatibility.

### Components Affected

| Component | Change |
|---|---|
| `src/components/dashboard/CreateResumeModal.tsx` | New card layout with thumbnails, render starter markdown previews |
| `src/services/resumes.ts` | `createResume` accepts `styles` field |

---

## Icon Library

**Lucide React** (`lucide-react`) for the editor UI (Design panel controls, modal icons).

For resume content (contact icons in `contactLayout: 'icons'`), SVG paths are extracted from Lucide and stored as string constants in `src/lib/contactIcons.ts`. This ensures icons render identically in browser preview and Puppeteer PDF without requiring the React component library at render time.

Icons used: Mail, Phone, MapPin, Globe, Linkedin, Github.

---

## What Is NOT In Scope

- Dark mode for resume content
- Custom CSS override
- Photo/avatar support
- Section reordering (drag-and-drop)
- Additional presets beyond the existing 5
- Pro/free gating on any styling option (all free)
