import type { ResumeStyles } from "./styleUtils";
import { CONTACT_ICONS, detectContactType } from "./contactIcons";

const DATE_PATTERN =
  /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–—]+\s*(?:Present|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})|\b\d{4}\s*[-–—]+\s*(?:Present|\d{4})|\b\d{1,2}\/\d{4}\s*[-–—]+\s*(?:Present|\d{1,2}\/\d{4}))\b/i;

/**
 * Main entry point. Applies HTML post-processing transformations based on
 * the active ResumeStyles. All transformations are pure string operations
 * so they work identically in browser preview and PDF generation.
 */
export function postProcessHtml(html: string, styles: ResumeStyles): string {
  let out = html;

  if (styles.contactLayout !== "inline") {
    out = processContactLayout(out, styles.contactLayout);
  }

  if (styles.skillsDisplay !== "inline") {
    out = processSkillsDisplay(out, styles.skillsDisplay);
  }

  if (styles.dateAlignment !== "inline") {
    out = processDateAlignment(out);
  }

  return out;
}

// ---------------------------------------------------------------------------
// Contact layout
// ---------------------------------------------------------------------------

/**
 * Finds the first <p> immediately after </h1> and reformats contact segments
 * (split on | or middot) according to the chosen layout.
 */
export function processContactLayout(
  html: string,
  layout: "stacked" | "icons",
): string {
  // Match </h1> followed by optional whitespace then a <p>...</p> block
  return html.replace(
    /(<\/h1>)\s*<p>([^<]+)<\/p>/i,
    (_match, h1Close, contactText) => {
      const segments = contactText
        .split(/[|·]/)
        .map((s: string) => s.trim())
        .filter(Boolean);

      let inner: string;
      let cls: string;

      if (layout === "stacked") {
        cls = "contact-stacked";
        inner = segments
          .map((seg: string) => `<span class="contact-item">${seg}</span>`)
          .join("");
      } else {
        // icons
        cls = "contact-icons";
        inner = segments
          .map((seg: string) => {
            const type = detectContactType(seg);
            return `<span class="contact-item">${CONTACT_ICONS[type]}${seg}</span>`;
          })
          .join("");
      }

      return `${h1Close}<p class="${cls}">${inner}</p>`;
    },
  );
}

// ---------------------------------------------------------------------------
// Skills display
// ---------------------------------------------------------------------------

/**
 * Finds the Skills section (h2 containing "skills") and transforms its
 * content according to the chosen display mode.
 */
export function processSkillsDisplay(
  html: string,
  display: "tags" | "columns",
): string {
  // Find the index of the <h2> containing "skills"
  const h2SkillsRe = /<h2[^>]*>[^<]*skills[^<]*<\/h2>/i;
  const h2SkillsMatch = h2SkillsRe.exec(html);
  if (!h2SkillsMatch) return html;

  const sectionStart = h2SkillsMatch.index + h2SkillsMatch[0].length;

  // Find the next <h2> after the skills heading (or end of string)
  const nextH2Re = /<h2/i;
  nextH2Re.lastIndex = sectionStart;
  const remaining = html.slice(sectionStart);
  const nextH2Match = nextH2Re.exec(remaining);
  const sectionEnd =
    nextH2Match !== null
      ? sectionStart + nextH2Match.index
      : html.length;

  const before = html.slice(0, sectionStart);
  const section = html.slice(sectionStart, sectionEnd);
  const after = html.slice(sectionEnd);

  if (display === "tags") {
    const transformed = section.replace(
      /<p>([\s\S]*?)<\/p>/gi,
      (_pMatch, pContent) => {
        // Handle <strong>Label:</strong> list, and plain comma lists
        const strongRe = /^(<strong>[^<]*<\/strong>\s*)/i;
        const strongMatch = strongRe.exec(pContent);

        let label = "";
        let listText = pContent;

        if (strongMatch) {
          label = strongMatch[1];
          listText = pContent.slice(strongMatch[0].length);
        }

        const skills = listText
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);

        const tags = skills
          .map((skill: string) => `<span class="skill-tag">${skill}</span>`)
          .join("");

        return `<p>${label}${tags}</p>`;
      },
    );

    return before + transformed + after;
  }

  // columns
  return before + `<div class="skills-columns">${section}</div>` + after;
}

// ---------------------------------------------------------------------------
// Date alignment
// ---------------------------------------------------------------------------

/**
 * Finds date patterns in <h3> elements and wraps them in
 * <span class="date-right">, adding class="date-flex" to the h3.
 * Pipe separators immediately adjacent to the date are also removed.
 */
export function processDateAlignment(html: string): string {
  return html.replace(/<h3([^>]*)>([\s\S]*?)<\/h3>/gi, (_match, attrs, content) => {
    const dateMatch = DATE_PATTERN.exec(content);
    if (!dateMatch) return _match;

    const dateStr = dateMatch[0];

    // Strip a pipe separator immediately before or after the date, then wrap
    // the date in a right-aligned span.
    let newContent = content.replace(
      new RegExp(`\\s*\\|\\s*${escapeRegex(dateStr)}|${escapeRegex(dateStr)}\\s*\\|\\s*`),
      ` <span class="date-right">${dateStr}</span>`,
    );

    // If no adjacent pipe was found, just wrap the date in place.
    if (newContent === content) {
      newContent = content.replace(
        dateStr,
        `<span class="date-right">${dateStr}</span>`,
      );
    }

    // Merge existing classes if any
    const existingClass = /class="([^"]*)"/.exec(attrs);
    let newAttrs: string;
    if (existingClass) {
      newAttrs = attrs.replace(
        /class="([^"]*)"/,
        `class="${existingClass[1]} date-flex"`,
      );
    } else {
      newAttrs = attrs + ' class="date-flex"';
    }

    return `<h3${newAttrs}>${newContent}</h3>`;
  });
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
