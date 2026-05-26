import type { ResumeStyles } from "../types/resume";
import { FONT_OPTIONS } from "../constants/presets";

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
