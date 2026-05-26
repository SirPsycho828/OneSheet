import * as fs from "fs";
import * as path from "path";
import { ResumeStyles, stylesToCssVars, stylesToDataAttrs } from "./styleUtils";

// ---------------------------------------------------------------------------
// Font paths — resolved relative to compiled output in lib/
// Fonts live at functions/fonts/ which is ../../fonts from lib/lib/pdf.js
// ---------------------------------------------------------------------------
const FONTS_DIR = path.join(__dirname, "..", "..", "fonts");

function fontDataUri(filename: string): string | null {
  const filePath = path.join(FONTS_DIR, filename);
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  return `data:font/woff2;base64,${data.toString("base64")}`;
}

function buildFontFaceBlock(): string {
  // Inter
  const inter400 = fontDataUri("Inter-Regular.woff2");
  const inter500 = fontDataUri("Inter-Medium.woff2");
  const inter600 = fontDataUri("Inter-SemiBold.woff2");

  // Crimson Text
  const crimson400 = fontDataUri("CrimsonText-Regular.woff2");
  const crimson700 = fontDataUri("CrimsonText-Bold.woff2");
  const crimsonItalic = fontDataUri("CrimsonText-Italic.woff2");

  // JetBrains Mono
  const jetbrains400 = fontDataUri("JetBrainsMono-Regular.woff2");

  // Source Serif 4
  const sourceSerif400 = fontDataUri("SourceSerif4-Regular.woff2");
  const sourceSerif600 = fontDataUri("SourceSerif4-SemiBold.woff2");
  const sourceSerif700 = fontDataUri("SourceSerif4-Bold.woff2");

  // Lora
  const lora400 = fontDataUri("Lora-Regular.woff2");
  const lora600 = fontDataUri("Lora-SemiBold.woff2");
  const lora700 = fontDataUri("Lora-Bold.woff2");

  // Playfair Display
  const playfair400 = fontDataUri("PlayfairDisplay-Regular.woff2");
  const playfair700 = fontDataUri("PlayfairDisplay-Bold.woff2");

  // Source Sans 3
  const sourceSans400 = fontDataUri("SourceSans3-Regular.woff2");
  const sourceSans600 = fontDataUri("SourceSans3-SemiBold.woff2");

  // Montserrat
  const montserrat400 = fontDataUri("Montserrat-Regular.woff2");
  const montserrat600 = fontDataUri("Montserrat-SemiBold.woff2");

  // Raleway
  const raleway400 = fontDataUri("Raleway-Regular.woff2");
  const raleway600 = fontDataUri("Raleway-SemiBold.woff2");

  const faces: string[] = [];

  // Inter
  if (inter400) faces.push(`@font-face { font-family: "Inter"; font-style: normal; font-weight: 400; src: url("${inter400}") format("woff2"); }`);
  if (inter500) faces.push(`@font-face { font-family: "Inter"; font-style: normal; font-weight: 500; src: url("${inter500}") format("woff2"); }`);
  if (inter600) faces.push(`@font-face { font-family: "Inter"; font-style: normal; font-weight: 600; src: url("${inter600}") format("woff2"); }`);

  // Crimson Text
  if (crimson400) faces.push(`@font-face { font-family: "Crimson Text"; font-style: normal; font-weight: 400; src: url("${crimson400}") format("woff2"); }`);
  if (crimson700) faces.push(`@font-face { font-family: "Crimson Text"; font-style: normal; font-weight: 700; src: url("${crimson700}") format("woff2"); }`);
  if (crimsonItalic) faces.push(`@font-face { font-family: "Crimson Text"; font-style: italic; font-weight: 400; src: url("${crimsonItalic}") format("woff2"); }`);

  // JetBrains Mono
  if (jetbrains400) faces.push(`@font-face { font-family: "JetBrains Mono"; font-style: normal; font-weight: 400; src: url("${jetbrains400}") format("woff2"); }`);

  // Source Serif 4
  if (sourceSerif400) faces.push(`@font-face { font-family: "Source Serif 4"; font-style: normal; font-weight: 400; src: url("${sourceSerif400}") format("woff2"); }`);
  if (sourceSerif600) faces.push(`@font-face { font-family: "Source Serif 4"; font-style: normal; font-weight: 600; src: url("${sourceSerif600}") format("woff2"); }`);
  if (sourceSerif700) faces.push(`@font-face { font-family: "Source Serif 4"; font-style: normal; font-weight: 700; src: url("${sourceSerif700}") format("woff2"); }`);

  // Lora
  if (lora400) faces.push(`@font-face { font-family: "Lora"; font-style: normal; font-weight: 400; src: url("${lora400}") format("woff2"); }`);
  if (lora600) faces.push(`@font-face { font-family: "Lora"; font-style: normal; font-weight: 600; src: url("${lora600}") format("woff2"); }`);
  if (lora700) faces.push(`@font-face { font-family: "Lora"; font-style: normal; font-weight: 700; src: url("${lora700}") format("woff2"); }`);

  // Playfair Display
  if (playfair400) faces.push(`@font-face { font-family: "Playfair Display"; font-style: normal; font-weight: 400; src: url("${playfair400}") format("woff2"); }`);
  if (playfair700) faces.push(`@font-face { font-family: "Playfair Display"; font-style: normal; font-weight: 700; src: url("${playfair700}") format("woff2"); }`);

  // Source Sans 3
  if (sourceSans400) faces.push(`@font-face { font-family: "Source Sans 3"; font-style: normal; font-weight: 400; src: url("${sourceSans400}") format("woff2"); }`);
  if (sourceSans600) faces.push(`@font-face { font-family: "Source Sans 3"; font-style: normal; font-weight: 600; src: url("${sourceSans600}") format("woff2"); }`);

  // Montserrat
  if (montserrat400) faces.push(`@font-face { font-family: "Montserrat"; font-style: normal; font-weight: 400; src: url("${montserrat400}") format("woff2"); }`);
  if (montserrat600) faces.push(`@font-face { font-family: "Montserrat"; font-style: normal; font-weight: 600; src: url("${montserrat600}") format("woff2"); }`);

  // Raleway
  if (raleway400) faces.push(`@font-face { font-family: "Raleway"; font-style: normal; font-weight: 400; src: url("${raleway400}") format("woff2"); }`);
  if (raleway600) faces.push(`@font-face { font-family: "Raleway"; font-style: normal; font-weight: 600; src: url("${raleway600}") format("woff2"); }`);

  return faces.length > 0 ? faces.join("\n") : "";
}

// ---------------------------------------------------------------------------
// Unified resume CSS — matches frontend src/styles/templates/resume.css
// ---------------------------------------------------------------------------
const RESUME_CSS = `
/* Base styles */
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
.resume-content *, .resume-content *::before, .resume-content *::after { box-sizing: border-box; }
.resume-content a { color: inherit; text-decoration: none; }
.resume-content table { border-collapse: collapse; width: 100%; }
.resume-content td, .resume-content th { padding: 2px 8px; text-align: left; }
.resume-content p, .resume-content ul, .resume-content ol,
.resume-content h1, .resume-content h2, .resume-content h3 { margin: 0; padding: 0; }
.resume-content ul, .resume-content ol { padding-left: 18px; }
.resume-content li {
  margin-bottom: var(--spacing-item, 2px);
  list-style-type: var(--bullet-style, disc);
}

/* Headings */
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
.resume-content p {
  margin-bottom: var(--spacing-item, 3px);
}
.resume-content hr {
  border: none;
  border-top: var(--section-divider, 1px) solid #d1d5db;
  margin: var(--spacing-section, 16px) 0;
}

/* Header divider (name -> contact line) */
.resume-content h1 + p {
  padding-bottom: 4px;
  border-bottom: var(--header-divider-width, 0) solid var(--accent-color, #000);
}

/* Preset-specific structural overrides */
[data-preset="modern"] .resume-content hr { display: none; }
[data-preset="modern"] .resume-content ul { list-style: none; padding-left: 12px; border-left: 2px solid #e5e7eb; }
[data-preset="technical"] .resume-content li { list-style: none; padding-left: 0; }
[data-preset="technical"] .resume-content ul { padding-left: 18px; }
[data-preset="technical"] .resume-content li::before { content: "> "; }
[data-preset="compact"] .resume-content { column-count: 2; column-gap: 24px; }
[data-preset="compact"] .resume-content h1 { column-span: all; }
[data-preset="compact"] .resume-content h1 + p { column-span: all; }
[data-preset="compact"] .resume-content hr:first-of-type { column-span: all; visibility: hidden; height: 0; margin: 0; }
[data-preset="compact"] .resume-content h2,
[data-preset="compact"] .resume-content h3 { break-inside: avoid; }

/* Contact layout styles */
.contact-stacked .contact-item, .contact-icons .contact-item {
  display: inline-block;
  margin-right: 12px;
  margin-bottom: 2px;
}
.contact-stacked .contact-item { display: block; }

/* Skills display styles */
.skill-tag {
  display: inline-block;
  padding: 1px 8px;
  margin: 2px 4px 2px 0;
  font-size: calc(var(--font-size-base, 14px) * 0.85);
  background: #f3f4f6;
  border-radius: 4px;
  line-height: 1.6;
}
.skills-columns { column-count: 2; column-gap: 16px; }

/* Date alignment styles */
h3.date-flex {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.date-right {
  font-weight: 400;
  white-space: nowrap;
  margin-left: 8px;
}
`;

// Paper widths in px at 96 DPI
const PAPER_WIDTHS: Record<string, number> = {
  "us-letter": 816,
  a4: 794,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface BuildHtmlParams {
  renderedHtml: string;
  styles: ResumeStyles;
  scaleFactor: number;
}

export function buildHtmlDocument(params: BuildHtmlParams): string {
  const { renderedHtml, styles, scaleFactor } = params;

  const paperWidthPx = PAPER_WIDTHS[styles.pageSize] ?? PAPER_WIDTHS["us-letter"];
  const contentWidth = Math.round(100 / scaleFactor);
  const paddingPx = Math.round(styles.pageMargin * 96);

  // Generate CSS custom properties from styles
  const cssVars = stylesToCssVars(styles);
  const inlineStyle = Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ");

  // Generate data attributes from styles
  const dataAttrs = stylesToDataAttrs(styles);
  const dataAttrStr = Object.entries(dataAttrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(" ");

  // Google Fonts CDN fallback — includes all 9 font families
  const googleFontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&family=Source+Serif+4:wght@400;600;700&family=Lora:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Source+Sans+3:wght@400;600&family=Montserrat:wght@400;600&family=Raleway:wght@400;600&display=swap" rel="stylesheet">`;

  const fontFaceBlock = buildFontFaceBlock();
  // If we have local fonts embedded as data URIs, skip the CDN link
  const fontStyleTag = fontFaceBlock
    ? `<style>${fontFaceBlock}</style>`
    : googleFontsLink;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${fontStyleTag}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: white; }
${RESUME_CSS}
</style>
</head>
<body>
<div class="paper" ${dataAttrStr} style="${inlineStyle}; width: ${paperWidthPx}px; padding: ${paddingPx}px;">
  <div class="resume-content" style="transform: scale(${scaleFactor}); transform-origin: top left; width: ${contentWidth}%;">
    ${renderedHtml}
  </div>
</div>
</body>
</html>`;
}

export async function generatePdf(
  html: string,
  paperSize: "us-letter" | "a4"
): Promise<Buffer> {
  // Dynamic require to avoid bundling issues with CommonJS
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const chromium = require("@sparticuz/chromium");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const puppeteer = require("puppeteer-core");

  const pdfDimensions =
    paperSize === "a4"
      ? { width: "210mm", height: "297mm" }
      : { width: "8.5in", height: "11in" };

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      width: pdfDimensions.width,
      height: pdfDimensions.height,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
