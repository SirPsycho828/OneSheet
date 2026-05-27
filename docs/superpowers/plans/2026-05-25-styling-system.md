# Styling System & Resume Modal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the template-based styling system with a comprehensive CSS custom properties system featuring presets, granular controls, a Design panel in the editor, and a redesigned resume creation modal with thumbnails.

**Architecture:** CSS custom properties on the resume container element drive all visual styling. A single `resume.css` replaces 5 template-specific CSS files. A `postProcessHtml()` function handles structural HTML transformations (contact icons, skills tags, date alignment). The editor's left panel gains a Source/Design toggle, with the Design panel providing full control over all style properties. Styles are stored as a `styles` object on the Firestore resume document.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vite, Firebase Firestore, Puppeteer (PDF), Lucide React (icons), Vitest (tests)

---

## File Structure

### New files
| File | Responsibility |
|---|---|
| `src/constants/presets.ts` | Preset definitions, font list, accent color list, spacing maps |
| `src/lib/styleUtils.ts` | Converts `ResumeStyles` → CSS custom properties object + data attributes |
| `src/lib/contactIcons.ts` | Inline SVG path strings for contact line icons (Mail, Phone, MapPin, Globe, Linkedin, Github) |
| `src/lib/postProcess.ts` | `postProcessHtml()` — transforms rendered HTML for contact layout, skills display, date alignment |
| `src/styles/templates/resume.css` | Single unified resume stylesheet using CSS custom properties |
| `src/components/editor/DesignPanel.tsx` | Full Design panel UI with all style controls |
| `src/__tests__/postProcess.test.ts` | Tests for postProcessHtml |
| `src/__tests__/styleUtils.test.ts` | Tests for style utilities |

### Modified files
| File | Change |
|---|---|
| `src/types/resume.ts` | Add `ResumeStyles` interface, add optional `styles` field to `Resume` |
| `src/styles/index.css` | Remove 5 template imports, add `resume.css` import, add new Google Fonts |
| `src/hooks/useResume.ts` | Add `styles` state, derive defaults for legacy resumes, include in save/dirty tracking |
| `src/hooks/useOverflow.ts` | Accept `ResumeStyles` instead of `templateId` string |
| `src/components/editor/PaperContainer.tsx` | Apply CSS custom properties + `data-preset` from styles |
| `src/components/editor/MeasureContainer.tsx` | Apply CSS custom properties + `data-preset` from styles |
| `src/components/editor/ResumePreview.tsx` | Pass styles, run postProcessHtml on rendered HTML |
| `src/components/editor/EditorLayout.tsx` | Add Source/Design toggle, render DesignPanel in Design mode |
| `src/pages/Editor.tsx` | Manage styles via useResume, remove TemplatePicker, pass styles through |
| `src/components/layout/AppNav.tsx` | Remove template picker button, keep other actions |
| `src/components/dashboard/CreateResumeModal.tsx` | Add thumbnail previews, pass `styles` on create |
| `src/components/dashboard/ResumeCard.tsx` | Use styles for thumbnail rendering |
| `src/components/profile/ProfileResume.tsx` | Use styles for rendering |
| `src/services/resumes.ts` | Add `styles` to `updateResume` accepted fields and `createResume` |
| `functions/src/lib/pdf.ts` | Accept `ResumeStyles`, generate CSS vars, use single stylesheet |
| `functions/src/routes/pdf.ts` | Pass styles from resume doc |
| `functions/src/routes/profile.ts` | Pass styles for public profile rendering |

### Removed files
| File | Reason |
|---|---|
| `src/styles/templates/classic.css` | Replaced by `resume.css` |
| `src/styles/templates/modern.css` | Replaced by `resume.css` |
| `src/styles/templates/minimal.css` | Replaced by `resume.css` |
| `src/styles/templates/technical.css` | Replaced by `resume.css` |
| `src/styles/templates/compact.css` | Replaced by `resume.css` |
| `src/components/templates/TemplatePicker.tsx` | Replaced by Design panel |
| `src/components/templates/TemplateCard.tsx` | No longer needed |
| `src/constants/templates.ts` | Replaced by `presets.ts` |

---

## Task 1: Types and Constants

**Files:**
- Modify: `src/types/resume.ts`
- Create: `src/constants/presets.ts`

- [ ] **Step 1: Add ResumeStyles interface to resume.ts**

```typescript
// Add after the Overflow interface in src/types/resume.ts

export interface ResumeStyles {
  preset: 'classic' | 'modern' | 'minimal' | 'technical' | 'compact';
  displayFont: string;
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  headerAlignment: 'left' | 'center' | 'right';
  density: 'compact' | 'standard' | 'relaxed';
  sectionSpacing: 'tight' | 'normal' | 'relaxed';
  pageMargin: number;
  showHeaderDivider: boolean;
  showSectionDividers: boolean;
  bulletStyle: 'disc' | 'dash' | 'arrow' | 'square' | 'none';
  contactLayout: 'inline' | 'stacked' | 'icons';
  skillsDisplay: 'inline' | 'tags' | 'columns';
  dateAlignment: 'right' | 'inline';
  pageSize: 'us-letter' | 'a4';
}
```

- [ ] **Step 2: Add optional styles field to Resume interface**

In `src/types/resume.ts`, add `styles?: ResumeStyles;` to the `Resume` interface (after `paperSize`). Keep `templateId` and `paperSize` for backward compatibility.

- [ ] **Step 3: Create presets.ts with all constants**

Create `src/constants/presets.ts`:

```typescript
import type { ResumeStyles } from "../types/resume";

export type PresetId = ResumeStyles["preset"];

export interface PresetMeta {
  id: PresetId;
  name: string;
  description: string;
}

export const PRESET_LIST: PresetMeta[] = [
  { id: "classic", name: "Classic", description: "Traditional serif resume, ATS-friendly" },
  { id: "modern", name: "Modern", description: "Clean sans-serif with color accents" },
  { id: "minimal", name: "Minimal", description: "Maximum content density, understated" },
  { id: "technical", name: "Technical", description: "Monospace developer style" },
  { id: "compact", name: "Compact", description: "Two-column high density layout" },
];

export const PRESET_DEFAULTS: Record<PresetId, ResumeStyles> = {
  classic: {
    preset: "classic",
    displayFont: "Crimson Text",
    bodyFont: "Crimson Text",
    fontSize: 15,
    lineHeight: 1.4,
    accentColor: "#000000",
    headerAlignment: "center",
    density: "standard",
    sectionSpacing: "normal",
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: "disc",
    contactLayout: "inline",
    skillsDisplay: "inline",
    dateAlignment: "inline",
    pageSize: "us-letter",
  },
  modern: {
    preset: "modern",
    displayFont: "Inter",
    bodyFont: "Inter",
    fontSize: 14,
    lineHeight: 1.4,
    accentColor: "#2563EB",
    headerAlignment: "left",
    density: "standard",
    sectionSpacing: "normal",
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: false,
    bulletStyle: "none",
    contactLayout: "inline",
    skillsDisplay: "inline",
    dateAlignment: "inline",
    pageSize: "us-letter",
  },
  minimal: {
    preset: "minimal",
    displayFont: "Inter",
    bodyFont: "Inter",
    fontSize: 13,
    lineHeight: 1.3,
    accentColor: "#6B7280",
    headerAlignment: "left",
    density: "compact",
    sectionSpacing: "tight",
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: "dash",
    contactLayout: "inline",
    skillsDisplay: "inline",
    dateAlignment: "inline",
    pageSize: "us-letter",
  },
  technical: {
    preset: "technical",
    displayFont: "JetBrains Mono",
    bodyFont: "JetBrains Mono",
    fontSize: 13,
    lineHeight: 1.4,
    accentColor: "#000000",
    headerAlignment: "left",
    density: "standard",
    sectionSpacing: "normal",
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: "arrow",
    contactLayout: "inline",
    skillsDisplay: "inline",
    dateAlignment: "inline",
    pageSize: "us-letter",
  },
  compact: {
    preset: "compact",
    displayFont: "Inter",
    bodyFont: "Inter",
    fontSize: 13,
    lineHeight: 1.3,
    accentColor: "#000000",
    headerAlignment: "left",
    density: "compact",
    sectionSpacing: "tight",
    pageMargin: 0.5,
    showHeaderDivider: false,
    showSectionDividers: true,
    bulletStyle: "disc",
    contactLayout: "inline",
    skillsDisplay: "inline",
    dateAlignment: "inline",
    pageSize: "us-letter",
  },
};

export interface FontOption {
  name: string;
  family: string;  // CSS font-family value
  category: "serif" | "sans-serif" | "monospace";
}

export const FONT_OPTIONS: FontOption[] = [
  { name: "Crimson Text", family: '"Crimson Text", serif', category: "serif" },
  { name: "Source Serif 4", family: '"Source Serif 4", serif', category: "serif" },
  { name: "Lora", family: '"Lora", serif', category: "serif" },
  { name: "Playfair Display", family: '"Playfair Display", serif', category: "serif" },
  { name: "Inter", family: '"Inter", system-ui, sans-serif', category: "sans-serif" },
  { name: "Source Sans 3", family: '"Source Sans 3", sans-serif', category: "sans-serif" },
  { name: "Montserrat", family: '"Montserrat", sans-serif', category: "sans-serif" },
  { name: "Raleway", family: '"Raleway", sans-serif', category: "sans-serif" },
  { name: "JetBrains Mono", family: '"JetBrains Mono", monospace', category: "monospace" },
];

export interface AccentColor {
  name: string;
  hex: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  { name: "Black", hex: "#000000" },
  { name: "Slate", hex: "#475569" },
  { name: "Charcoal", hex: "#374151" },
  { name: "Navy", hex: "#1e3a5f" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Teal", hex: "#0d9488" },
  { name: "Forest", hex: "#166534" },
  { name: "Purple", hex: "#7c3aed" },
  { name: "Burgundy", hex: "#7f1d1d" },
];

/** Derives a complete ResumeStyles from a legacy resume that only has templateId + paperSize. */
export function deriveStyles(templateId: string, paperSize: "us-letter" | "a4"): ResumeStyles {
  const presetId = (templateId in PRESET_DEFAULTS ? templateId : "classic") as PresetId;
  return { ...PRESET_DEFAULTS[presetId], pageSize: paperSize };
}
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: No errors related to the new types.

- [ ] **Step 5: Commit**

```bash
git add src/types/resume.ts src/constants/presets.ts
git commit -m "feat: add ResumeStyles type and preset constants"
```

---

## Task 2: Style Utilities

**Files:**
- Create: `src/lib/styleUtils.ts`
- Create: `src/__tests__/styleUtils.test.ts`

- [ ] **Step 1: Write failing tests for stylesToCssVars**

Create `src/__tests__/styleUtils.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { stylesToCssVars, stylesToDataAttrs } from "../lib/styleUtils";
import { PRESET_DEFAULTS } from "../constants/presets";

describe("stylesToCssVars", () => {
  it("converts classic preset to CSS custom properties", () => {
    const vars = stylesToCssVars(PRESET_DEFAULTS.classic);
    expect(vars["--font-display"]).toBe('"Crimson Text", serif');
    expect(vars["--font-body"]).toBe('"Crimson Text", serif');
    expect(vars["--font-size-base"]).toBe("15px");
    expect(vars["--line-height"]).toBe("1.4");
    expect(vars["--accent-color"]).toBe("#000000");
    expect(vars["--header-align"]).toBe("center");
    expect(vars["--margin-page"]).toBe("48px");
    expect(vars["--section-divider"]).toBe("1px");
    expect(vars["--header-divider"]).toBe("none");
    expect(vars["--bullet-style"]).toBe("disc");
  });

  it("maps density + sectionSpacing to correct spacing values", () => {
    const vars = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      density: "compact",
      sectionSpacing: "tight",
    });
    expect(vars["--spacing-section"]).toBe("8px");
    expect(vars["--spacing-item"]).toBe("2px");
  });

  it("converts page margin inches to px at 96 DPI", () => {
    const vars = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      pageMargin: 1.0,
    });
    expect(vars["--margin-page"]).toBe("96px");
  });

  it("maps dash bullet style correctly", () => {
    const vars = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      bulletStyle: "dash",
    });
    expect(vars["--bullet-style"]).toBe('"– "');
  });
});

describe("stylesToDataAttrs", () => {
  it("returns data-preset matching the preset", () => {
    const attrs = stylesToDataAttrs(PRESET_DEFAULTS.compact);
    expect(attrs["data-preset"]).toBe("compact");
  });

  it("includes data-contact-layout when not inline", () => {
    const attrs = stylesToDataAttrs({
      ...PRESET_DEFAULTS.classic,
      contactLayout: "icons",
    });
    expect(attrs["data-contact-layout"]).toBe("icons");
  });

  it("includes data-date-align when right", () => {
    const attrs = stylesToDataAttrs({
      ...PRESET_DEFAULTS.classic,
      dateAlignment: "right",
    });
    expect(attrs["data-date-align"]).toBe("right");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/styleUtils.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement styleUtils.ts**

Create `src/lib/styleUtils.ts`:

```typescript
import type { ResumeStyles } from "../types/resume";
import { FONT_OPTIONS } from "../constants/presets";

// Density × sectionSpacing → [--spacing-section, --spacing-item] in px
const SPACING_MAP: Record<string, [number, number]> = {
  "compact-tight":   [8, 2],
  "compact-normal":  [10, 2],
  "compact-relaxed": [12, 3],
  "standard-tight":  [12, 3],
  "standard-normal": [16, 4],
  "standard-relaxed":[20, 5],
  "relaxed-tight":   [16, 4],
  "relaxed-normal":  [20, 6],
  "relaxed-relaxed": [24, 8],
};

const BULLET_CSS: Record<ResumeStyles["bulletStyle"], string> = {
  disc: "disc",
  dash: '"– "',
  arrow: '"▸ "',
  square: "square",
  none: "none",
};

function fontFamily(fontName: string): string {
  const found = FONT_OPTIONS.find((f) => f.name === fontName);
  return found ? found.family : `"${fontName}", sans-serif`;
}

/**
 * Converts a ResumeStyles object into a Record of CSS custom property names → values.
 * These are applied as inline styles on the resume container element.
 */
export function stylesToCssVars(styles: ResumeStyles): Record<string, string> {
  const spacingKey = `${styles.density}-${styles.sectionSpacing}`;
  const [sectionPx, itemPx] = SPACING_MAP[spacingKey] ?? SPACING_MAP["standard-normal"];
  const marginPx = Math.round(styles.pageMargin * 96);

  return {
    "--font-display": fontFamily(styles.displayFont),
    "--font-body": fontFamily(styles.bodyFont),
    "--font-size-base": `${styles.fontSize}px`,
    "--line-height": String(styles.lineHeight),
    "--accent-color": styles.accentColor,
    "--header-align": styles.headerAlignment,
    "--spacing-section": `${sectionPx}px`,
    "--spacing-item": `${itemPx}px`,
    "--margin-page": `${marginPx}px`,
    "--section-divider": styles.showSectionDividers ? "1px" : "0",
    "--header-divider": styles.showHeaderDivider ? "block" : "none",
    "--bullet-style": BULLET_CSS[styles.bulletStyle],
  };
}

/**
 * Returns data attributes to apply on the resume container for structural CSS variants.
 */
export function stylesToDataAttrs(styles: ResumeStyles): Record<string, string> {
  const attrs: Record<string, string> = {
    "data-preset": styles.preset,
  };
  if (styles.contactLayout !== "inline") {
    attrs["data-contact-layout"] = styles.contactLayout;
  }
  if (styles.skillsDisplay !== "inline") {
    attrs["data-skills-display"] = styles.skillsDisplay;
  }
  if (styles.dateAlignment !== "inline") {
    attrs["data-date-align"] = styles.dateAlignment;
  }
  return attrs;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/styleUtils.test.ts`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/styleUtils.ts src/__tests__/styleUtils.test.ts
git commit -m "feat: add style-to-CSS-vars utility with tests"
```

---

## Task 3: Contact Icons

**Files:**
- Create: `src/lib/contactIcons.ts`

- [ ] **Step 1: Create contactIcons.ts with inline SVG strings**

Extract the SVG path data from Lucide icons (Mail, Phone, MapPin, Globe, Linkedin, Github) and store as string constants. These are used by `postProcessHtml` and must work in both browser and Puppeteer (no React dependency).

Create `src/lib/contactIcons.ts`:

```typescript
/**
 * Inline SVG strings for contact line icons, extracted from Lucide.
 * Rendered as raw HTML (not React components) so they work in both
 * browser preview and Puppeteer PDF generation.
 */

const SVG_ATTRS = 'xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:4px;margin-top:-2px"';

export const CONTACT_ICONS = {
  mail: `<svg ${SVG_ATTRS}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg ${SVG_ATTRS}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  mapPin: `<svg ${SVG_ATTRS}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`,
  globe: `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  linkedin: `<svg ${SVG_ATTRS}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
  github: `<svg ${SVG_ATTRS}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
} as const;

export type ContactIconType = keyof typeof CONTACT_ICONS;

/**
 * Detects which icon to use based on a contact info segment string.
 */
export function detectContactType(segment: string): ContactIconType {
  const s = segment.trim().toLowerCase();
  if (s.includes("@") && !s.includes("github")) return "mail";
  if (/linkedin/i.test(s)) return "linkedin";
  if (/github/i.test(s)) return "github";
  if (/^[\d(+]/.test(s) || /\d{3}.*\d{4}/.test(s)) return "phone";
  if (/https?:\/\/|\.com|\.io|\.dev|\.org|\.net/i.test(s)) return "globe";
  return "mapPin";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/contactIcons.ts
git commit -m "feat: add inline SVG contact icons from Lucide"
```

---

## Task 4: HTML Post-Processing

**Files:**
- Create: `src/lib/postProcess.ts`
- Create: `src/__tests__/postProcess.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/postProcess.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { postProcessHtml } from "../lib/postProcess";
import { PRESET_DEFAULTS } from "../constants/presets";
import type { ResumeStyles } from "../types/resume";

function withStyles(overrides: Partial<ResumeStyles>): ResumeStyles {
  return { ...PRESET_DEFAULTS.classic, ...overrides };
}

describe("postProcessHtml", () => {
  describe("contactLayout", () => {
    const html = '<h1>John Doe</h1><p>john@email.com | (555) 123-4567 | San Francisco, CA</p>';

    it("returns html unchanged when contactLayout is inline", () => {
      const result = postProcessHtml(html, withStyles({ contactLayout: "inline" }));
      expect(result).toBe(html);
    });

    it("wraps contact segments in spans when stacked", () => {
      const result = postProcessHtml(html, withStyles({ contactLayout: "stacked" }));
      expect(result).toContain('class="contact-item"');
      expect(result).toContain("john@email.com");
      expect(result).toContain("(555) 123-4567");
      expect(result).toContain("San Francisco, CA");
    });

    it("prepends SVG icons when icons layout", () => {
      const result = postProcessHtml(html, withStyles({ contactLayout: "icons" }));
      expect(result).toContain("<svg");
      expect(result).toContain("john@email.com");
    });
  });

  describe("skillsDisplay", () => {
    const html = '<h2>Skills</h2><p><strong>Languages:</strong> JavaScript, TypeScript, Python</p>';

    it("returns html unchanged when skillsDisplay is inline", () => {
      const result = postProcessHtml(html, withStyles({ skillsDisplay: "inline" }));
      expect(result).toBe(html);
    });

    it("wraps skills in tag spans when tags", () => {
      const result = postProcessHtml(html, withStyles({ skillsDisplay: "tags" }));
      expect(result).toContain('class="skill-tag"');
      expect(result).toContain("JavaScript");
    });
  });

  describe("dateAlignment", () => {
    const html = '<h3>Software Engineer | Acme Corp | Jan 2020 - Present</h3>';

    it("returns html unchanged when dateAlignment is inline", () => {
      const result = postProcessHtml(html, withStyles({ dateAlignment: "inline" }));
      expect(result).toBe(html);
    });

    it("wraps date in span with date-right class", () => {
      const result = postProcessHtml(html, withStyles({ dateAlignment: "right" }));
      expect(result).toContain('class="date-right"');
      expect(result).toContain("Jan 2020 - Present");
    });
  });

  it("applies all three transformations together", () => {
    const html = [
      '<h1>Jane Smith</h1>',
      '<p>jane@test.com | (555) 999-0000</p>',
      '<h2>Skills</h2>',
      '<p>React, Node.js, TypeScript</p>',
      '<h3>Engineer | Acme | Mar 2021 - Present</h3>',
    ].join("");

    const result = postProcessHtml(html, withStyles({
      contactLayout: "icons",
      skillsDisplay: "tags",
      dateAlignment: "right",
    }));

    expect(result).toContain("<svg");
    expect(result).toContain('class="skill-tag"');
    expect(result).toContain('class="date-right"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/postProcess.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement postProcess.ts**

Create `src/lib/postProcess.ts`:

```typescript
import type { ResumeStyles } from "../types/resume";
import { CONTACT_ICONS, detectContactType } from "./contactIcons";

/**
 * Post-processes rendered HTML based on style settings.
 * Handles: contact layout, skills display, date alignment.
 *
 * This is a pure function used identically in browser preview
 * and Cloud Functions PDF generation.
 */
export function postProcessHtml(html: string, styles: ResumeStyles): string {
  let result = html;

  if (styles.contactLayout !== "inline") {
    result = processContactLayout(result, styles.contactLayout);
  }

  if (styles.skillsDisplay !== "inline") {
    result = processSkillsDisplay(result, styles.skillsDisplay);
  }

  if (styles.dateAlignment !== "inline") {
    result = processDateAlignment(result);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Contact layout
// ---------------------------------------------------------------------------

function processContactLayout(html: string, layout: "stacked" | "icons"): string {
  // Match the first <p> that immediately follows </h1>
  const pattern = /(<\/h1>)\s*<p>([^<]+)<\/p>/i;
  const match = html.match(pattern);
  if (!match) return html;

  const [fullMatch, h1Close, contactText] = match;
  // Split on | or · separators
  const segments = contactText.split(/\s*[|·]\s*/).filter(Boolean);

  let replacement: string;

  if (layout === "stacked") {
    const items = segments
      .map((seg) => `<span class="contact-item">${seg.trim()}</span>`)
      .join("");
    replacement = `${h1Close}<p class="contact-stacked">${items}</p>`;
  } else {
    // icons
    const items = segments.map((seg) => {
      const trimmed = seg.trim();
      const iconType = detectContactType(trimmed);
      const icon = CONTACT_ICONS[iconType];
      return `<span class="contact-item">${icon}${trimmed}</span>`;
    }).join("");
    replacement = `${h1Close}<p class="contact-icons">${items}</p>`;
  }

  return html.replace(fullMatch, replacement);
}

// ---------------------------------------------------------------------------
// Skills display
// ---------------------------------------------------------------------------

function processSkillsDisplay(html: string, display: "tags" | "columns"): string {
  // Find <h2> containing "skills" (case-insensitive), then process content until next <h2> or end
  const skillsHeaderPattern = /<h2>([^<]*skills[^<]*)<\/h2>/i;
  const headerMatch = html.match(skillsHeaderPattern);
  if (!headerMatch) return html;

  const headerIndex = html.indexOf(headerMatch[0]);
  const afterHeader = headerIndex + headerMatch[0].length;

  // Find the next <h2> after the skills header, or end of string
  const nextH2 = html.indexOf("<h2>", afterHeader);
  const sectionEnd = nextH2 === -1 ? html.length : nextH2;
  const sectionContent = html.slice(afterHeader, sectionEnd);

  let processedSection: string;

  if (display === "tags") {
    processedSection = convertSkillsToTags(sectionContent);
  } else {
    // columns
    processedSection = `<div class="skills-columns">${sectionContent}</div>`;
  }

  return html.slice(0, afterHeader) + processedSection + html.slice(sectionEnd);
}

function convertSkillsToTags(sectionHtml: string): string {
  // Handle two patterns:
  // 1. <p><strong>Label:</strong> skill1, skill2, skill3</p>
  // 2. <p>skill1, skill2, skill3</p>
  return sectionHtml.replace(/<p>(.*?)<\/p>/g, (_match, content: string) => {
    // Check for <strong>Label:</strong> pattern
    const labelMatch = content.match(/^<strong>([^<]+)<\/strong>\s*(.*)$/);

    let label = "";
    let skillsText: string;

    if (labelMatch) {
      label = `<strong>${labelMatch[1]}</strong> `;
      skillsText = labelMatch[2];
    } else {
      skillsText = content;
    }

    const skills = skillsText.split(/,\s*/);
    if (skills.length <= 1) return `<p>${content}</p>`;

    const tags = skills
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `<span class="skill-tag">${s}</span>`)
      .join("");

    return `<p class="skills-tags-row">${label}${tags}</p>`;
  });
}

// ---------------------------------------------------------------------------
// Date alignment
// ---------------------------------------------------------------------------

// Matches patterns like: Jan 2020 - Present, 2019 -- 2022, Mar 2021 - Dec 2023, MM/YYYY
const DATE_PATTERN = /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]+\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})|\b\d{4}\s*[-–—]+\s*(?:Present|\d{4})|\b\d{1,2}\/\d{4}\s*[-–—]+\s*(?:Present|\d{1,2}\/\d{4}))\b/i;

function processDateAlignment(html: string): string {
  // Process <h3> elements that contain dates
  return html.replace(/<h3>(.*?)<\/h3>/g, (_match, content: string) => {
    const dateMatch = content.match(DATE_PATTERN);
    if (!dateMatch) return `<h3>${content}</h3>`;

    const date = dateMatch[0];
    const rest = content.replace(date, "").replace(/\s*\|\s*$/, "").replace(/^\s*\|\s*/, "").trim();

    return `<h3 class="date-flex">${rest}<span class="date-right">${date}</span></h3>`;
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/postProcess.test.ts`
Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/postProcess.ts src/__tests__/postProcess.test.ts
git commit -m "feat: add HTML post-processor for contact, skills, and dates"
```

---

## Task 5: Unified Resume CSS

**Files:**
- Create: `src/styles/templates/resume.css`
- Modify: `src/styles/index.css`
- Delete: `src/styles/templates/classic.css`, `modern.css`, `minimal.css`, `technical.css`, `compact.css`

- [ ] **Step 1: Create resume.css**

Create `src/styles/templates/resume.css`:

```css
/* ==========================================================================
   resume.css — Unified resume styles using CSS custom properties
   ========================================================================== */

/* ---------------------------------------------------------------------------
   Base styles (shared across all presets)
   --------------------------------------------------------------------------- */

.resume-content {
  box-sizing: border-box;
  font-family: var(--font-body);
  font-size: var(--font-size-base, 14px);
  line-height: var(--line-height, 1.4);
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

.resume-content *,
.resume-content *::before,
.resume-content *::after {
  box-sizing: border-box;
}

/* Links */
.resume-content a {
  color: inherit;
  text-decoration: none;
}

/* Tables */
.resume-content table {
  border-collapse: collapse;
  width: 100%;
}

.resume-content td,
.resume-content th {
  padding: 2px 8px;
  text-align: left;
}

/* Reset margins */
.resume-content p,
.resume-content ul,
.resume-content ol,
.resume-content h1,
.resume-content h2,
.resume-content h3 {
  margin: 0;
  padding: 0;
}

/* Lists */
.resume-content ul,
.resume-content ol {
  padding-left: 18px;
}

.resume-content li {
  margin-bottom: var(--spacing-item, 2px);
  list-style-type: var(--bullet-style, disc);
}

/* ---------------------------------------------------------------------------
   Headings
   --------------------------------------------------------------------------- */

.resume-content h1 {
  font-family: var(--font-display);
  font-size: calc(var(--font-size-base, 14px) * 1.6);
  font-weight: 700;
  text-align: var(--header-align, left);
  margin-bottom: 4px;
}

.resume-content h2 {
  font-size: calc(var(--font-size-base, 14px) * 1.05);
  font-weight: 600;
  color: var(--accent-color, #000);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  margin-top: var(--spacing-section, 16px);
  margin-bottom: calc(var(--spacing-section, 16px) * 0.4);
  border-bottom: var(--section-divider, 1px) solid currentColor;
  padding-bottom: 2px;
}

.resume-content h3 {
  font-size: var(--font-size-base, 14px);
  font-weight: 600;
  margin-top: calc(var(--spacing-section, 16px) * 0.5);
  margin-bottom: 2px;
}

/* Paragraphs */
.resume-content p {
  margin-bottom: var(--spacing-item, 3px);
}

/* Dividers */
.resume-content hr {
  border: none;
  border-top: var(--section-divider, 1px) solid #d1d5db;
  margin: calc(var(--spacing-section, 16px) * 0.5) 0;
}

/* Header divider: inserted after h1's adjacent paragraph */
.resume-content h1 + p {
  padding-bottom: 4px;
  border-bottom: var(--header-divider-width, 0) solid var(--accent-color, #000);
}

/* ---------------------------------------------------------------------------
   Preset-specific structural overrides
   --------------------------------------------------------------------------- */

/* Modern: hide hr, borderless left-line bullets */
[data-preset="modern"] .resume-content hr {
  display: none;
}

[data-preset="modern"] .resume-content ul {
  list-style: none;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

/* Technical: custom bullet prefix */
[data-preset="technical"] .resume-content li {
  list-style: none;
  padding-left: 0;
}

[data-preset="technical"] .resume-content ul {
  padding-left: 18px;
}

[data-preset="technical"] .resume-content li::before {
  content: "> ";
}

/* Compact: two-column layout */
[data-preset="compact"] .resume-content {
  column-count: 2;
  column-gap: 24px;
}

[data-preset="compact"] .resume-content > h1 {
  column-span: all;
}

[data-preset="compact"] .resume-content > h1 + p {
  column-span: all;
}

[data-preset="compact"] .resume-content > hr:first-of-type {
  column-span: all;
  visibility: hidden;
  height: 0;
  margin: 0;
}

[data-preset="compact"] .resume-content h2,
[data-preset="compact"] .resume-content h3 {
  break-inside: avoid;
}

/* ---------------------------------------------------------------------------
   Contact layout styles
   --------------------------------------------------------------------------- */

.resume-content .contact-stacked .contact-item,
.resume-content .contact-icons .contact-item {
  display: inline-block;
  margin-right: 12px;
  margin-bottom: 2px;
}

.resume-content .contact-stacked .contact-item {
  display: block;
}

/* ---------------------------------------------------------------------------
   Skills display styles
   --------------------------------------------------------------------------- */

.resume-content .skill-tag {
  display: inline-block;
  padding: 1px 8px;
  margin: 2px 4px 2px 0;
  font-size: calc(var(--font-size-base, 14px) * 0.85);
  background: #f3f4f6;
  border-radius: 4px;
  line-height: 1.6;
}

.resume-content .skills-columns {
  column-count: 2;
  column-gap: 16px;
}

/* ---------------------------------------------------------------------------
   Date alignment styles
   --------------------------------------------------------------------------- */

.resume-content h3.date-flex {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.resume-content .date-right {
  font-weight: 400;
  white-space: nowrap;
  margin-left: 8px;
}
```

- [ ] **Step 2: Update index.css**

Replace the 5 template imports with the single resume.css import and add new Google Fonts:

In `src/styles/index.css`, replace the Google Fonts import line with:

```css
@import url("https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono&family=Source+Serif+4:wght@400;600;700&family=Lora:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@400;600&family=Montserrat:wght@400;500;600&family=Raleway:wght@400;500;600&display=swap");
```

Replace the template import block:

```css
@import "./templates/base.css";
@import "./templates/classic.css";
@import "./templates/modern.css";
@import "./templates/minimal.css";
@import "./templates/technical.css";
@import "./templates/compact.css";
```

With:

```css
@import "./templates/resume.css";
```

Note: `base.css` functionality is now included in `resume.css`.

- [ ] **Step 3: Delete old template CSS files**

Delete: `src/styles/templates/classic.css`, `modern.css`, `minimal.css`, `technical.css`, `compact.css`, `base.css`

- [ ] **Step 4: Verify the app still builds**

Run: `npx vite build`
Expected: Build succeeds (though resume styling will be broken until Task 6 applies CSS vars).

- [ ] **Step 5: Commit**

```bash
git add src/styles/templates/resume.css src/styles/index.css
git rm src/styles/templates/base.css src/styles/templates/classic.css src/styles/templates/modern.css src/styles/templates/minimal.css src/styles/templates/technical.css src/styles/templates/compact.css
git commit -m "feat: replace 5 template CSS files with unified resume.css"
```

---

## Task 6: Update Rendering Components

**Files:**
- Modify: `src/components/editor/PaperContainer.tsx`
- Modify: `src/components/editor/MeasureContainer.tsx`
- Modify: `src/components/editor/ResumePreview.tsx`
- Modify: `src/hooks/useOverflow.ts`

- [ ] **Step 1: Update PaperContainer to accept styles and apply CSS vars**

In `src/components/editor/PaperContainer.tsx`:

Replace the props interface and component to accept `styles: ResumeStyles` instead of `templateId: string` and `paperSize: "us-letter" | "a4"`. Import `stylesToCssVars` and `stylesToDataAttrs` from `../../lib/styleUtils`. Apply CSS vars as inline `style` on the resume container div, and spread data attributes.

Key changes:
- Props: replace `paperSize` and `templateId` with `styles: ResumeStyles`
- Use `styles.pageSize` for paper dimensions
- Replace `data-template={templateId}` with `{...dataAttrs}` from `stylesToDataAttrs(styles)`
- Apply CSS vars + page margin on the container:

```tsx
const cssVars = stylesToCssVars(styles);
const dataAttrs = stylesToDataAttrs(styles);
const pageMarginPx = Math.round(styles.pageMargin * 96);
```

Replace the inner padding div `style={{ padding: "48px" }}` with `style={{ padding: pageMarginPx }}`.

Replace the `<div data-template={templateId}>` with:

```tsx
<div style={cssVars as React.CSSProperties} {...dataAttrs}>
```

- [ ] **Step 2: Update MeasureContainer similarly**

In `src/components/editor/MeasureContainer.tsx`:

Replace `templateId: string` and `paperSize` props with `styles: ResumeStyles`. Apply CSS vars and data attrs. Use `styles.pageSize` for dimensions.

Replace `data-template={templateId}` in the outer div's attributes with spread `{...dataAttrs}` and apply `style` with CSS vars.

Update the width calculation to use the page margin from styles:

```tsx
const pageMarginPx = Math.round(styles.pageMargin * 96);
const contentWidth = width - pageMarginPx * 2;
```

- [ ] **Step 3: Update useOverflow to accept styles**

In `src/hooks/useOverflow.ts`:

Change the signature from `(htmlContent, templateId, paperSize)` to `(htmlContent, styles: ResumeStyles)`. Use `styles.pageSize` for paper dimensions. Use page margin from styles for padding calculation:

```typescript
const pageMarginPx = Math.round(styles.pageMargin * 96);
const containerHeight = paperHeight - pageMarginPx * 2;
```

Keep `styles` in the dependency array of the effect instead of `templateId` and `paperSize`. Since `styles` is an object that changes reference on every render, compare by serializing: use `JSON.stringify(styles)` as the dep, or pass individual relevant fields. The simplest approach: use `styles.pageSize` and `styles.pageMargin` as deps since those are the only fields that affect overflow measurement, plus `htmlContent`.

- [ ] **Step 4: Update ResumePreview to use styles and run postProcessHtml**

In `src/components/editor/ResumePreview.tsx`:

Replace `templateId: string` and `paperSize` props with `styles: ResumeStyles`. Import `postProcessHtml` from `../../lib/postProcess`.

After `renderMarkdown(debouncedMarkdown)` resolves, run `postProcessHtml(html, styles)` before setting `htmlContent`.

Pass `styles` to `MeasureContainer`, `PaperContainer`, and `useOverflow` instead of `templateId`/`paperSize`.

```tsx
const html = await renderMarkdown(debouncedMarkdown);
const processed = postProcessHtml(html, styles);
if (!cancelled) setHtmlContent(processed);
```

Note: `postProcessHtml` needs to re-run when styles change, not just when markdown changes. Add `styles.contactLayout`, `styles.skillsDisplay`, `styles.dateAlignment` to a dependency that triggers re-processing. The simplest approach: store raw HTML separately from processed HTML, and re-process when styles change:

```tsx
const [rawHtml, setRawHtml] = React.useState("");
const processedHtml = React.useMemo(
  () => postProcessHtml(rawHtml, styles),
  [rawHtml, styles.contactLayout, styles.skillsDisplay, styles.dateAlignment]
);
```

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Errors in Editor.tsx and other consumers (they still pass old props). This is expected — we fix those in Task 8.

- [ ] **Step 6: Commit**

```bash
git add src/components/editor/PaperContainer.tsx src/components/editor/MeasureContainer.tsx src/components/editor/ResumePreview.tsx src/hooks/useOverflow.ts
git commit -m "feat: update rendering pipeline to use ResumeStyles + CSS vars"
```

---

## Task 7: Update useResume Hook

**Files:**
- Modify: `src/hooks/useResume.ts`
- Modify: `src/services/resumes.ts`

- [ ] **Step 1: Update resumes service to accept styles**

In `src/services/resumes.ts`, update the `updateResume` function's `data` parameter type to include `styles`:

```typescript
export async function updateResume(
  resumeId: string,
  data: Partial<Pick<Resume, "markdown" | "title" | "templateId" | "overflow" | "paperSize" | "showQrCode" | "qrCodeUrl" | "styles">>
): Promise<void> {
```

- [ ] **Step 2: Update useResume to manage styles state**

In `src/hooks/useResume.ts`:

Import `ResumeStyles` from types and `deriveStyles` from constants/presets.

Add a `styles` state:

```typescript
const [styles, setStyles] = useState<ResumeStyles | null>(null);
```

In the load effect, after loading the resume, derive styles:

```typescript
if (loaded) {
  // ... existing code ...
  const resolvedStyles = loaded.styles ?? deriveStyles(loaded.templateId, loaded.paperSize ?? "us-letter");
  setStyles(resolvedStyles);
}
```

Include `styles` in the dirty check, save function, debounce, last-saved ref, and local backup. The `templateId` and `paperSize` setters can be replaced by updating styles directly, but keep them for backward compat during the transition. When styles changes, also sync `templateId` and `paperSize` from styles:

```typescript
// When styles updates, sync legacy fields
const effectiveTemplateId = styles?.preset ?? templateId;
const effectivePaperSize = styles?.pageSize ?? paperSize;
```

Add `styles` to the save payload:

```typescript
const current = {
  markdown, title, templateId: styles?.preset ?? templateId,
  paperSize: styles?.pageSize ?? paperSize,
  showQrCode, qrCodeUrl,
  styles: styles ?? undefined,
};
```

Return `styles` and `setStyles` from the hook.

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: Some consumers still need updating.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useResume.ts src/services/resumes.ts
git commit -m "feat: add styles state to useResume hook and resume service"
```

---

## Task 8: Design Panel Component

**Files:**
- Create: `src/components/editor/DesignPanel.tsx`

- [ ] **Step 1: Create the DesignPanel component**

Create `src/components/editor/DesignPanel.tsx`. This is the largest single component. It renders all 6 collapsible sections: Presets, Typography, Color, Layout, Elements, Page.

The component receives `styles: ResumeStyles` and `onStylesChange: (styles: ResumeStyles) => void` as props.

Key implementation details:
- Each section is a collapsible `<details>` element (all open by default)
- Preset cards: 3×2 grid. Clicking a preset calls `onStylesChange(PRESET_DEFAULTS[presetId])` with confirmation if overrides exist
- Font dropdowns: render each option in its own font via `style={{ fontFamily }}`
- Color swatches: row of circles with check mark on selected. Custom opens a text input for hex
- Sliders use `<input type="range">` for fontSize and lineHeight
- Toggles use `<button>` styled as toggle switches
- "Reset to preset" button at the bottom

Full implementation code: the component is ~400 lines. Build it section by section with these sub-components inlined:
- `PresetGrid` — 3×2 grid of preset cards
- `TypographySection` — font dropdowns + sliders
- `ColorSection` — accent color swatches + custom picker
- `LayoutSection` — alignment buttons + dropdowns
- `ElementsSection` — toggles and dropdowns
- `PageSection` — page size dropdown + guides checkbox

Each control calls `onStylesChange({ ...styles, [field]: newValue })`.

For the preset confirmation: compare current styles against `PRESET_DEFAULTS[styles.preset]` to detect if any values have been customized. If yes and user clicks a different preset, show `window.confirm()`.

- [ ] **Step 2: Verify component compiles**

Run: `npx tsc --noEmit`
Expected: No errors in DesignPanel.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/DesignPanel.tsx
git commit -m "feat: add Design panel with all style controls"
```

---

## Task 9: Editor Layout Source/Design Toggle

**Files:**
- Modify: `src/components/editor/EditorLayout.tsx`

- [ ] **Step 1: Add Source/Design toggle and DesignPanel rendering**

Update `EditorLayout` props to accept `styles: ResumeStyles` and `onStylesChange: (styles: ResumeStyles) => void` instead of `templateId` and `paperSize`.

Add a `leftMode` state: `"source" | "design"`.

In the desktop layout's left panel, add a tab bar at the top:

```tsx
<div className="flex border-b border-gray-200 bg-white flex-shrink-0">
  <button
    type="button"
    onClick={() => setLeftMode("source")}
    className={/* active tab styling */}
  >
    <Code className="w-4 h-4" strokeWidth={1.5} />
    Source
  </button>
  <button
    type="button"
    onClick={() => setLeftMode("design")}
    className={/* active tab styling */}
  >
    <Palette className="w-4 h-4" strokeWidth={1.5} />
    Design
  </button>
</div>
```

Import `Palette` from `lucide-react`.

Below the tabs, conditionally render either `MarkdownInput` (source) or `DesignPanel` (design):

```tsx
{leftMode === "source" ? (
  <MarkdownInput ... />
) : (
  <DesignPanel styles={styles} onStylesChange={onStylesChange} />
)}
```

Pass `styles` to `ResumePreview` instead of `templateId`/`paperSize`.

For the mobile layout, add a third tab "Design" alongside "Edit" and "Preview":

```tsx
type MobileTab = "edit" | "design" | "preview";
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`

- [ ] **Step 3: Commit**

```bash
git add src/components/editor/EditorLayout.tsx
git commit -m "feat: add Source/Design toggle to EditorLayout"
```

---

## Task 10: Update Editor Page and AppNav

**Files:**
- Modify: `src/pages/Editor.tsx`
- Modify: `src/components/layout/AppNav.tsx`
- Delete: `src/components/templates/TemplatePicker.tsx`
- Delete: `src/components/templates/TemplateCard.tsx`
- Delete: `src/constants/templates.ts`

- [ ] **Step 1: Update Editor.tsx**

Remove the TemplatePicker import and state. Destructure `styles` and `setStyles` from `useResume`.

Pass `styles` and `onStylesChange={setStyles}` to `EditorLayout` instead of `templateId` and `paperSize`.

Remove the `isPickerOpen` state, the `TemplatePicker` component render, and the `onOpenTemplatePicker` prop on `AppNav`.

Update snapshot calls to use `styles?.preset ?? "classic"` instead of `templateId`.

Keep the paper size toggle in `StatusBar` working — it should update `setStyles(prev => ({ ...prev, pageSize: newSize }))`.

- [ ] **Step 2: Update AppNav**

Remove the template picker button and `onOpenTemplatePicker` prop. Remove the `TEMPLATES` import from `../../constants/templates`. The "Template" button in the navbar is no longer needed since preset selection happens in the Design panel.

Keep all other buttons (AI Tools, Share, Export PDF, kebab menu).

- [ ] **Step 3: Delete old template files**

Delete:
- `src/components/templates/TemplatePicker.tsx`
- `src/components/templates/TemplateCard.tsx`
- `src/constants/templates.ts`

- [ ] **Step 4: Verify the app builds**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git rm src/components/templates/TemplatePicker.tsx src/components/templates/TemplateCard.tsx src/constants/templates.ts
git add src/pages/Editor.tsx src/components/layout/AppNav.tsx
git commit -m "feat: wire up styles throughout editor, remove TemplatePicker"
```

---

## Task 11: Update Dashboard Components

**Files:**
- Modify: `src/components/dashboard/ResumeCard.tsx`
- Modify: `src/components/dashboard/CreateResumeModal.tsx`

- [ ] **Step 1: Update ResumeCard thumbnails**

In `src/components/dashboard/ResumeCard.tsx`:

Update `ResumeThumbnail` to accept `styles?: ResumeStyles` (optional for backward compat). Import `stylesToCssVars`, `stylesToDataAttrs`, and `deriveStyles`.

Derive styles if not present: `const resolvedStyles = styles ?? deriveStyles(templateId, paperSize)`.

Apply CSS vars and data attrs on the thumbnail container:

```tsx
const cssVars = stylesToCssVars(resolvedStyles);
const dataAttrs = stylesToDataAttrs(resolvedStyles);
const pageMarginPx = Math.round(resolvedStyles.pageMargin * 96);

// Replace <div style={{ padding: "48px" }} data-template={templateId}>
// With:
<div style={{ padding: pageMarginPx, ...cssVars } as React.CSSProperties} {...dataAttrs}>
```

Update `handleDuplicate` to pass `styles` when duplicating.

- [ ] **Step 2: Redesign CreateResumeModal with thumbnails**

In `src/components/dashboard/CreateResumeModal.tsx`:

Import `renderMarkdown`, `stylesToCssVars`, `stylesToDataAttrs`, and `PRESET_DEFAULTS`.

Add a state for rendered thumbnails:

```tsx
const [thumbnails, setThumbnails] = React.useState<Record<string, string>>({});

React.useEffect(() => {
  if (!isOpen) return;
  let cancelled = false;
  Promise.all(
    STARTER_TEMPLATES.map(async (t) => {
      const html = await renderMarkdown(t.markdown);
      return [t.id, html] as const;
    })
  ).then((entries) => {
    if (!cancelled) setThumbnails(Object.fromEntries(entries));
  });
  return () => { cancelled = true; };
}, [isOpen]);
```

Replace the text-only card grid with a card that has a thumbnail on the left:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  {STARTER_TEMPLATES.map((t) => (
    <button
      key={t.id}
      type="button"
      onClick={() => handlePickTemplate(t)}
      className="flex items-start gap-3 p-3 text-left rounded-lg border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-[100px] bg-gray-100 rounded overflow-hidden" style={{ aspectRatio: "1/1.294" }}>
        {t.id === "custom" ? (
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
        ) : thumbnails[t.id] ? (
          <div style={{ width: 816, height: 1056, transform: `scale(${100 / 816})`, transformOrigin: "top left" }} className="bg-white">
            <div style={{ padding: 48, ...stylesToCssVars(PRESET_DEFAULTS.classic) } as React.CSSProperties} {...stylesToDataAttrs(PRESET_DEFAULTS.classic)}>
              <div className="resume-content" dangerouslySetInnerHTML={{ __html: thumbnails[t.id] }} />
            </div>
          </div>
        ) : null}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{t.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
      </div>
    </button>
  ))}
</div>
```

Import `Plus` from `lucide-react`.

Update `handleCreate` to pass `styles: PRESET_DEFAULTS.classic` in the `createResume` call.

- [ ] **Step 3: Verify the dashboard builds**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/ResumeCard.tsx src/components/dashboard/CreateResumeModal.tsx
git commit -m "feat: add resume thumbnails to CreateResumeModal, update ResumeCard"
```

---

## Task 12: Update ProfileResume

**Files:**
- Modify: `src/components/profile/ProfileResume.tsx`

- [ ] **Step 1: Update ProfileResume to use styles**

Add `styles?: ResumeStyles` to props (optional, derive from templateId/paperSize if missing). Import `stylesToCssVars`, `stylesToDataAttrs`, `deriveStyles`.

Replace `data-template={templateId}` with CSS vars + data attrs from styles. Use page margin from styles for padding.

```tsx
const resolvedStyles = styles ?? deriveStyles(templateId, paperSize);
const cssVars = stylesToCssVars(resolvedStyles);
const dataAttrs = stylesToDataAttrs(resolvedStyles);
const pageMarginPx = Math.round(resolvedStyles.pageMargin * 96);
```

Replace both desktop and mobile `data-template` divs with:

```tsx
<div style={{ ...cssVars, padding: pageMarginPx } as React.CSSProperties} {...dataAttrs}>
```

- [ ] **Step 2: Update PublicProfile page to pass styles**

Find where `ProfileResume` is rendered in `src/pages/PublicProfile.tsx` and pass the `styles` prop from the fetched resume data.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ProfileResume.tsx src/pages/PublicProfile.tsx
git commit -m "feat: update ProfileResume to use CSS custom properties"
```

---

## Task 13: Update PDF Pipeline (Cloud Functions)

**Files:**
- Modify: `functions/src/lib/pdf.ts`
- Modify: `functions/src/routes/pdf.ts`
- Modify: `functions/src/routes/profile.ts`
- Create: `functions/src/lib/styleUtils.ts` (server-side copy)
- Create: `functions/src/lib/postProcess.ts` (server-side copy)
- Create: `functions/src/lib/contactIcons.ts` (server-side copy)

- [ ] **Step 1: Copy shared utilities to functions**

The `postProcessHtml`, `stylesToCssVars`, `stylesToDataAttrs`, and `contactIcons` modules need to work in the Cloud Functions environment (Node.js, no browser APIs). Since they're pure functions with no browser dependencies, copy them to `functions/src/lib/`:

- Copy `src/lib/styleUtils.ts` → `functions/src/lib/styleUtils.ts`
- Copy `src/lib/postProcess.ts` → `functions/src/lib/postProcess.ts`
- Copy `src/lib/contactIcons.ts` → `functions/src/lib/contactIcons.ts`

Adjust import paths: the functions copies import `ResumeStyles` from a local type definition. Add the `ResumeStyles` interface to a shared types file in functions, or duplicate the interface inline.

Create `functions/src/types/resume.ts`:

```typescript
export interface ResumeStyles {
  preset: string;
  displayFont: string;
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  headerAlignment: 'left' | 'center' | 'right';
  density: 'compact' | 'standard' | 'relaxed';
  sectionSpacing: 'tight' | 'normal' | 'relaxed';
  pageMargin: number;
  showHeaderDivider: boolean;
  showSectionDividers: boolean;
  bulletStyle: 'disc' | 'dash' | 'arrow' | 'square' | 'none';
  contactLayout: 'inline' | 'stacked' | 'icons';
  skillsDisplay: 'inline' | 'tags' | 'columns';
  dateAlignment: 'right' | 'inline';
  pageSize: 'us-letter' | 'a4';
}
```

- [ ] **Step 2: Refactor pdf.ts to use styles**

In `functions/src/lib/pdf.ts`:

Replace the `TEMPLATE_CSS` record with a function that generates CSS from the unified resume stylesheet + CSS custom properties.

Update `BuildHtmlParams`:

```typescript
export interface BuildHtmlParams {
  renderedHtml: string;
  styles: ResumeStyles;
  scaleFactor: number;
}
```

Update `buildHtmlDocument` to:
1. Import `stylesToCssVars` and `stylesToDataAttrs`
2. Generate inline CSS vars from styles
3. Use a single `RESUME_CSS` constant (the same rules as `resume.css` but as a string)
4. Apply `data-preset` attribute instead of `data-template`
5. Use page margin from styles for padding

The font face block should include all 9 fonts. Add new woff2 files to `functions/fonts/` (Source Serif 4, Lora, Playfair Display, Source Sans 3, Montserrat, Raleway).

- [ ] **Step 3: Update pdf route to pass styles**

In `functions/src/routes/pdf.ts`:

Read `styles` from the resume document. If missing, derive from `templateId` and `paperSize` using a simple default mapping.

Run `postProcessHtml(renderedHtml, styles)` before passing to `buildHtmlDocument`.

```typescript
const styles: ResumeStyles = resumeData.styles ?? deriveStylesServer(resumeData.templateId, resumeData.paperSize);
const processed = postProcessHtml(renderedHtml, styles);
const html = buildHtmlDocument({ renderedHtml: processed, styles, scaleFactor });
```

- [ ] **Step 4: Update profile route similarly**

In `functions/src/routes/profile.ts`, pass styles when building HTML for the public profile.

- [ ] **Step 5: Verify functions build**

Run: `cd functions && npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add functions/src/lib/styleUtils.ts functions/src/lib/postProcess.ts functions/src/lib/contactIcons.ts functions/src/types/resume.ts functions/src/lib/pdf.ts functions/src/routes/pdf.ts functions/src/routes/profile.ts
git commit -m "feat: update PDF pipeline to use ResumeStyles + CSS vars"
```

---

## Task 14: Download Font Files

**Files:**
- Add: `functions/fonts/*.woff2` (6 new font files)

- [ ] **Step 1: Download woff2 files for new fonts**

Download the following woff2 files from Google Fonts and place them in `functions/fonts/`:

- `SourceSerif4-Regular.woff2`, `SourceSerif4-SemiBold.woff2`, `SourceSerif4-Bold.woff2`
- `Lora-Regular.woff2`, `Lora-SemiBold.woff2`, `Lora-Bold.woff2`
- `PlayfairDisplay-Regular.woff2`, `PlayfairDisplay-SemiBold.woff2`, `PlayfairDisplay-Bold.woff2`
- `SourceSans3-Regular.woff2`, `SourceSans3-SemiBold.woff2`
- `Montserrat-Regular.woff2`, `Montserrat-Medium.woff2`, `Montserrat-SemiBold.woff2`
- `Raleway-Regular.woff2`, `Raleway-Medium.woff2`, `Raleway-SemiBold.woff2`

Use the Google Fonts API to download the woff2 files. The exact URLs can be found by inspecting the CSS returned by the Google Fonts import URL in a browser.

- [ ] **Step 2: Update buildFontFaceBlock in pdf.ts**

Add font-face declarations for each new font, following the existing pattern with `fontDataUri()`.

- [ ] **Step 3: Commit**

```bash
git add functions/fonts/
git commit -m "feat: add woff2 font files for PDF generation"
```

---

## Task 15: Final Integration & Cleanup

**Files:**
- Various cleanup

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Build the full app**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Build Cloud Functions**

Run: `cd functions && npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Manual smoke test**

Start the dev server and verify:
1. Editor loads with existing resumes (backward compat — legacy resumes render with derived styles)
2. Source/Design toggle works
3. Changing a preset updates the live preview
4. Individual style controls update the preview in real-time
5. Auto-save persists styles to Firestore
6. Creating a new resume shows thumbnails in the modal
7. Dashboard ResumeCard thumbnails render correctly
8. Public profile page renders with styles

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete styling system and resume modal redesign"
```
