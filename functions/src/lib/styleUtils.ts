// ---------------------------------------------------------------------------
// Self-contained style utilities for Cloud Functions.
// Mirrors the frontend src/lib/styleUtils.ts + src/constants/presets.ts
// without importing from the frontend source tree.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResumeStyles {
  preset: "classic" | "modern" | "minimal" | "technical" | "compact";
  displayFont: string;
  bodyFont: string;
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  headerAlignment: "left" | "center" | "right";
  density: "compact" | "standard" | "relaxed";
  sectionSpacing: "tight" | "normal" | "relaxed";
  pageMargin: number;
  showHeaderDivider: boolean;
  showSectionDividers: boolean;
  bulletStyle: "disc" | "dash" | "arrow" | "square" | "none";
  contactLayout: "inline" | "stacked" | "icons";
  skillsDisplay: "inline" | "tags" | "columns";
  dateAlignment: "right" | "inline";
  pageSize: "us-letter" | "a4";
}

export type PresetId = "classic" | "modern" | "minimal" | "technical" | "compact";

// ---------------------------------------------------------------------------
// Font options
// ---------------------------------------------------------------------------

export interface FontOption {
  name: string;
  family: string;
  category: "serif" | "sans-serif" | "monospace";
}

export const FONT_OPTIONS: FontOption[] = [
  { name: "Crimson Text",     family: "'Crimson Text', Georgia, serif",              category: "serif" },
  { name: "Source Serif 4",   family: "'Source Serif 4', Georgia, serif",             category: "serif" },
  { name: "Lora",             family: "'Lora', Georgia, serif",                      category: "serif" },
  { name: "Playfair Display", family: "'Playfair Display', Georgia, serif",           category: "serif" },
  { name: "Inter",            family: "'Inter', system-ui, sans-serif",              category: "sans-serif" },
  { name: "Source Sans 3",    family: "'Source Sans 3', system-ui, sans-serif",       category: "sans-serif" },
  { name: "Montserrat",       family: "'Montserrat', system-ui, sans-serif",          category: "sans-serif" },
  { name: "Raleway",          family: "'Raleway', system-ui, sans-serif",             category: "sans-serif" },
  { name: "JetBrains Mono",   family: "'JetBrains Mono', 'Courier New', monospace",  category: "monospace" },
];

// ---------------------------------------------------------------------------
// Preset defaults
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Spacing & bullet maps
// ---------------------------------------------------------------------------

// Maps "${density}-${sectionSpacing}" -> [sectionPx, itemPx]
const SPACING_MAP: Record<string, [number, number]> = {
  "compact-tight":    [8,  2],
  "compact-normal":   [10, 2],
  "compact-relaxed":  [12, 3],
  "standard-tight":   [12, 3],
  "standard-normal":  [16, 4],
  "standard-relaxed": [20, 5],
  "relaxed-tight":    [16, 4],
  "relaxed-normal":   [20, 6],
  "relaxed-relaxed":  [24, 8],
};

// Maps bulletStyle -> CSS list-style-type value
const BULLET_CSS: Record<ResumeStyles["bulletStyle"], string> = {
  disc:   "disc",
  dash:   '"– "',
  arrow:  '"▸ "',
  square: "square",
  none:   "none",
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Looks up the font family string for a given font name.
 * Falls back to `"${fontName}", sans-serif` if not found in FONT_OPTIONS.
 */
function fontFamily(fontName: string): string {
  const found = FONT_OPTIONS.find((f) => f.name === fontName);
  return found ? found.family : `"${fontName}", sans-serif`;
}

/**
 * Converts a ResumeStyles object into CSS custom property key/value pairs
 * suitable for use as inline styles on a container element.
 */
export function stylesToCssVars(styles: ResumeStyles): Record<string, string> {
  const spacingKey = `${styles.density}-${styles.sectionSpacing}`;
  const [sectionPx, itemPx] = SPACING_MAP[spacingKey] ?? [16, 4];

  return {
    "--font-display":    fontFamily(styles.displayFont),
    "--font-body":       fontFamily(styles.bodyFont),
    "--font-size-base":  `${styles.fontSize}px`,
    "--line-height":     String(styles.lineHeight),
    "--accent-color":    styles.accentColor,
    "--header-align":    styles.headerAlignment,
    "--spacing-section": `${sectionPx}px`,
    "--spacing-item":    `${itemPx}px`,
    "--margin-page":     `${Math.round(styles.pageMargin * 96)}px`,
    "--section-divider": styles.showSectionDividers ? "1px" : "0",
    "--header-divider":  styles.showHeaderDivider ? "block" : "none",
    "--bullet-style":    BULLET_CSS[styles.bulletStyle],
  };
}

/**
 * Converts a ResumeStyles object into data attribute key/value pairs.
 * Only non-default (non-"inline") layout values are included to keep
 * the DOM clean and CSS selectors simple.
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

/**
 * Derives a full ResumeStyles object from a legacy templateId + paperSize.
 * Used as a fallback when the resume doc does not yet have a `styles` field.
 */
export function deriveStyles(
  templateId: string,
  paperSize: "us-letter" | "a4",
): ResumeStyles {
  const presetId =
    (templateId as PresetId) in PRESET_DEFAULTS
      ? (templateId as PresetId)
      : "classic";
  return {
    ...PRESET_DEFAULTS[presetId],
    pageSize: paperSize,
  };
}
