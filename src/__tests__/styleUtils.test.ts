import { describe, it, expect } from "vitest";
import { stylesToCssVars, stylesToDataAttrs } from "../lib/styleUtils";
import { PRESET_DEFAULTS } from "../constants/presets";

describe("stylesToCssVars", () => {
  it("converts classic preset to correct CSS custom properties", () => {
    const styles = PRESET_DEFAULTS.classic;
    const vars = stylesToCssVars(styles);

    // Font families
    expect(vars["--font-display"]).toBe("'Crimson Text', Georgia, serif");
    expect(vars["--font-body"]).toBe("'Crimson Text', Georgia, serif");

    // Font size and line height
    expect(vars["--font-size-base"]).toBe("15px");
    expect(vars["--line-height"]).toBe("1.4");

    // Accent color
    expect(vars["--accent-color"]).toBe("#000000");

    // Header alignment
    expect(vars["--header-align"]).toBe("center");

    // Margin: 0.5 inch * 96 DPI = 48px
    expect(vars["--margin-page"]).toBe("48px");

    // Section dividers: classic has showSectionDividers=true
    expect(vars["--section-divider"]).toBe("1px");

    // Header divider: classic has showHeaderDivider=false
    expect(vars["--header-divider"]).toBe("none");

    // Bullet style: disc
    expect(vars["--bullet-style"]).toBe("disc");
  });

  it("maps density + sectionSpacing to correct spacing values", () => {
    // compact + tight => sectionPx=8, itemPx=2
    const compactTight = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      density: "compact",
      sectionSpacing: "tight",
    });
    expect(compactTight["--spacing-section"]).toBe("8px");
    expect(compactTight["--spacing-item"]).toBe("2px");

    // standard + normal => sectionPx=16, itemPx=4
    const standardNormal = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      density: "standard",
      sectionSpacing: "normal",
    });
    expect(standardNormal["--spacing-section"]).toBe("16px");
    expect(standardNormal["--spacing-item"]).toBe("4px");

    // relaxed + relaxed => sectionPx=24, itemPx=8
    const relaxedRelaxed = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      density: "relaxed",
      sectionSpacing: "relaxed",
    });
    expect(relaxedRelaxed["--spacing-section"]).toBe("24px");
    expect(relaxedRelaxed["--spacing-item"]).toBe("8px");
  });

  it("converts page margin in inches to px at 96 DPI", () => {
    // 1.0 inch = 96px
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, pageMargin: 1.0 });
    expect(vars["--margin-page"]).toBe("96px");

    // 0.5 inch = 48px
    const vars2 = stylesToCssVars({ ...PRESET_DEFAULTS.classic, pageMargin: 0.5 });
    expect(vars2["--margin-page"]).toBe("48px");

    // 0.75 inch = 72px
    const vars3 = stylesToCssVars({ ...PRESET_DEFAULTS.classic, pageMargin: 0.75 });
    expect(vars3["--margin-page"]).toBe("72px");
  });

  it("maps dash bullet style to '\"– \"' CSS value", () => {
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, bulletStyle: "dash" });
    expect(vars["--bullet-style"]).toBe('"– "');
  });

  it("maps arrow bullet style to correct CSS value", () => {
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, bulletStyle: "arrow" });
    expect(vars["--bullet-style"]).toBe('"▸ "');
  });

  it("maps square bullet style to 'square'", () => {
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, bulletStyle: "square" });
    expect(vars["--bullet-style"]).toBe("square");
  });

  it("maps none bullet style to 'none'", () => {
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, bulletStyle: "none" });
    expect(vars["--bullet-style"]).toBe("none");
  });

  it("outputs --section-divider as '0' when showSectionDividers is false", () => {
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, showSectionDividers: false });
    expect(vars["--section-divider"]).toBe("0");
  });

  it("outputs --header-divider as 'block' when showHeaderDivider is true", () => {
    const vars = stylesToCssVars({ ...PRESET_DEFAULTS.classic, showHeaderDivider: true });
    expect(vars["--header-divider"]).toBe("block");
  });

  it("uses fallback font family for unknown font name", () => {
    const vars = stylesToCssVars({
      ...PRESET_DEFAULTS.classic,
      displayFont: "Unknown Font",
    });
    expect(vars["--font-display"]).toBe('"Unknown Font", sans-serif');
  });
});

describe("stylesToDataAttrs", () => {
  it("returns data-preset matching the preset", () => {
    const attrs = stylesToDataAttrs(PRESET_DEFAULTS.classic);
    expect(attrs["data-preset"]).toBe("classic");

    const attrs2 = stylesToDataAttrs(PRESET_DEFAULTS.modern);
    expect(attrs2["data-preset"]).toBe("modern");
  });

  it("omits data-contact-layout when contactLayout is 'inline'", () => {
    const attrs = stylesToDataAttrs({ ...PRESET_DEFAULTS.classic, contactLayout: "inline" });
    expect(attrs["data-contact-layout"]).toBeUndefined();
  });

  it("includes data-contact-layout when contactLayout is not 'inline'", () => {
    const stackedAttrs = stylesToDataAttrs({
      ...PRESET_DEFAULTS.classic,
      contactLayout: "stacked",
    });
    expect(stackedAttrs["data-contact-layout"]).toBe("stacked");

    const iconsAttrs = stylesToDataAttrs({
      ...PRESET_DEFAULTS.classic,
      contactLayout: "icons",
    });
    expect(iconsAttrs["data-contact-layout"]).toBe("icons");
  });

  it("omits data-skills-display when skillsDisplay is 'inline'", () => {
    const attrs = stylesToDataAttrs({ ...PRESET_DEFAULTS.classic, skillsDisplay: "inline" });
    expect(attrs["data-skills-display"]).toBeUndefined();
  });

  it("includes data-skills-display when skillsDisplay is not 'inline'", () => {
    const attrs = stylesToDataAttrs({
      ...PRESET_DEFAULTS.classic,
      skillsDisplay: "tags",
    });
    expect(attrs["data-skills-display"]).toBe("tags");
  });

  it("omits data-date-align when dateAlignment is 'inline'", () => {
    const attrs = stylesToDataAttrs({ ...PRESET_DEFAULTS.classic, dateAlignment: "inline" });
    expect(attrs["data-date-align"]).toBeUndefined();
  });

  it("includes data-date-align when dateAlignment is 'right'", () => {
    const attrs = stylesToDataAttrs({
      ...PRESET_DEFAULTS.classic,
      dateAlignment: "right",
    });
    expect(attrs["data-date-align"]).toBe("right");
  });
});
