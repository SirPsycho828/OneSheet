import { describe, it, expect } from "vitest";
import { postProcessHtml, processContactLayout, processSkillsDisplay, processDateAlignment } from "../lib/postProcess";
import { PRESET_DEFAULTS } from "../constants/presets";
import type { ResumeStyles } from "../types/resume";

function withStyles(overrides: Partial<ResumeStyles>): ResumeStyles {
  return { ...PRESET_DEFAULTS.classic, ...overrides };
}

// ---------------------------------------------------------------------------
// contactLayout
// ---------------------------------------------------------------------------

const CONTACT_HTML =
  '<h1>John Doe</h1><p>john@email.com | (555) 123-4567 | San Francisco, CA</p>';

describe("processContactLayout", () => {
  it("inline: postProcessHtml returns html unchanged", () => {
    const styles = withStyles({ contactLayout: "inline" });
    expect(postProcessHtml(CONTACT_HTML, styles)).toBe(CONTACT_HTML);
  });

  it("stacked: wraps each segment in <span class=\"contact-item\">", () => {
    const result = processContactLayout(CONTACT_HTML, "stacked");
    expect(result).toContain('class="contact-stacked"');
    expect(result).toContain('<span class="contact-item">john@email.com</span>');
    expect(result).toContain('<span class="contact-item">(555) 123-4567</span>');
    expect(result).toContain('<span class="contact-item">San Francisco, CA</span>');
  });

  it("icons: prepends SVG icons before each segment", () => {
    const result = processContactLayout(CONTACT_HTML, "icons");
    expect(result).toContain('class="contact-icons"');
    // Mail icon for email
    expect(result).toContain('<svg');
    // Each segment wrapped in contact-item
    expect(result).toContain('class="contact-item"');
    expect(result).toContain('john@email.com');
    expect(result).toContain('(555) 123-4567');
    expect(result).toContain('San Francisco, CA');
  });

  it("icons: uses correct icon types per segment", () => {
    const result = processContactLayout(CONTACT_HTML, "icons");
    // email segment: rect (mail icon contains <rect)
    expect(result).toContain('<rect');
    // phone segment: path with phone shape
    // location segment: path with map pin
    // All three segments should be present
    const itemCount = (result.match(/class="contact-item"/g) ?? []).length;
    expect(itemCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// skillsDisplay
// ---------------------------------------------------------------------------

const SKILLS_HTML =
  '<h2>Skills</h2><p><strong>Languages:</strong> JavaScript, TypeScript, Python</p>';

describe("processSkillsDisplay", () => {
  it("inline: postProcessHtml returns html unchanged", () => {
    const styles = withStyles({ skillsDisplay: "inline" });
    expect(postProcessHtml(SKILLS_HTML, styles)).toBe(SKILLS_HTML);
  });

  it("tags: wraps each skill in <span class=\"skill-tag\">", () => {
    const result = processSkillsDisplay(SKILLS_HTML, "tags");
    expect(result).toContain('<span class="skill-tag">JavaScript</span>');
    expect(result).toContain('<span class="skill-tag">TypeScript</span>');
    expect(result).toContain('<span class="skill-tag">Python</span>');
  });

  it("tags: preserves the <strong>Label:</strong> prefix", () => {
    const result = processSkillsDisplay(SKILLS_HTML, "tags");
    expect(result).toContain('<strong>Languages:</strong>');
  });

  it("tags: plain comma list (no label) wraps each skill", () => {
    const plain = '<h2>Skills</h2><p>React, Node.js, GraphQL</p>';
    const result = processSkillsDisplay(plain, "tags");
    expect(result).toContain('<span class="skill-tag">React</span>');
    expect(result).toContain('<span class="skill-tag">Node.js</span>');
    expect(result).toContain('<span class="skill-tag">GraphQL</span>');
  });
});

// ---------------------------------------------------------------------------
// dateAlignment
// ---------------------------------------------------------------------------

const DATE_HTML =
  '<h3>Software Engineer | Acme Corp | Jan 2020 - Present</h3>';

describe("processDateAlignment", () => {
  it("inline: postProcessHtml returns html unchanged", () => {
    const styles = withStyles({ dateAlignment: "inline" });
    expect(postProcessHtml(DATE_HTML, styles)).toBe(DATE_HTML);
  });

  it("right: wraps date in <span class=\"date-right\">", () => {
    const result = processDateAlignment(DATE_HTML);
    expect(result).toContain('<span class="date-right">');
    expect(result).toContain('Jan 2020 - Present');
  });

  it("right: adds class=\"date-flex\" to h3", () => {
    const result = processDateAlignment(DATE_HTML);
    expect(result).toContain('class="date-flex"');
  });

  it("right: handles YYYY - YYYY date format", () => {
    const html = '<h3>Project Manager | 2018 - 2021</h3>';
    const result = processDateAlignment(html);
    expect(result).toContain('<span class="date-right">2018 - 2021</span>');
    expect(result).toContain('class="date-flex"');
  });

  it("right: handles MM/YYYY date format", () => {
    const html = '<h3>Developer | 01/2019 - 06/2022</h3>';
    const result = processDateAlignment(html);
    expect(result).toContain('<span class="date-right">01/2019 - 06/2022</span>');
  });

  it("right: leaves h3 without date unchanged", () => {
    const html = '<h3>Some section heading</h3>';
    const result = processDateAlignment(html);
    expect(result).toBe(html);
  });
});

// ---------------------------------------------------------------------------
// Combined: all three transformations
// ---------------------------------------------------------------------------

describe("postProcessHtml combined", () => {
  it("applies all three transformations together", () => {
    const html = [
      '<h1>Jane Smith</h1>',
      '<p>jane@example.com | (555) 000-0000 | New York, NY</p>',
      '<h2>Skills</h2>',
      '<p><strong>Languages:</strong> Go, Rust, C++</p>',
      '<h3>Senior Engineer | MegaCorp | Mar 2019 - Present</h3>',
    ].join("");

    const styles = withStyles({
      contactLayout: "stacked",
      skillsDisplay: "tags",
      dateAlignment: "right",
    });

    const result = postProcessHtml(html, styles);

    // Contact: stacked
    expect(result).toContain('class="contact-stacked"');
    expect(result).toContain('<span class="contact-item">jane@example.com</span>');

    // Skills: tags
    expect(result).toContain('<span class="skill-tag">Go</span>');
    expect(result).toContain('<span class="skill-tag">Rust</span>');

    // Date: right
    expect(result).toContain('class="date-flex"');
    expect(result).toContain('<span class="date-right">');
    expect(result).toContain('Mar 2019 - Present');
  });
});
