import * as fs from "fs";
import * as path from "path";

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
  const inter400 = fontDataUri("Inter-Regular.woff2");
  const inter500 = fontDataUri("Inter-Medium.woff2");
  const inter600 = fontDataUri("Inter-SemiBold.woff2");
  const crimson400 = fontDataUri("CrimsonText-Regular.woff2");
  const crimson700 = fontDataUri("CrimsonText-Bold.woff2");
  const crimsonItalic = fontDataUri("CrimsonText-Italic.woff2");
  const jetbrains400 = fontDataUri("JetBrainsMono-Regular.woff2");

  const hasLocalFonts =
    inter400 || inter500 || inter600 || crimson400 || crimson700 || crimsonItalic || jetbrains400;

  if (!hasLocalFonts) return "";

  const faces: string[] = [];

  if (inter400) {
    faces.push(`@font-face { font-family: "Inter"; font-style: normal; font-weight: 400; src: url("${inter400}") format("woff2"); }`);
  }
  if (inter500) {
    faces.push(`@font-face { font-family: "Inter"; font-style: normal; font-weight: 500; src: url("${inter500}") format("woff2"); }`);
  }
  if (inter600) {
    faces.push(`@font-face { font-family: "Inter"; font-style: normal; font-weight: 600; src: url("${inter600}") format("woff2"); }`);
  }
  if (crimson400) {
    faces.push(`@font-face { font-family: "Crimson Text"; font-style: normal; font-weight: 400; src: url("${crimson400}") format("woff2"); }`);
  }
  if (crimson700) {
    faces.push(`@font-face { font-family: "Crimson Text"; font-style: normal; font-weight: 700; src: url("${crimson700}") format("woff2"); }`);
  }
  if (crimsonItalic) {
    faces.push(`@font-face { font-family: "Crimson Text"; font-style: italic; font-weight: 400; src: url("${crimsonItalic}") format("woff2"); }`);
  }
  if (jetbrains400) {
    faces.push(`@font-face { font-family: "JetBrains Mono"; font-style: normal; font-weight: 400; src: url("${jetbrains400}") format("woff2"); }`);
  }

  return faces.join("\n");
}

// ---------------------------------------------------------------------------
// Static CSS strings
// ---------------------------------------------------------------------------
const BASE_CSS = `
.resume-content {
  box-sizing: border-box;
  line-height: 1.4;
  color: #000;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
.resume-content *, .resume-content *::before, .resume-content *::after { box-sizing: border-box; }
.resume-content a { color: inherit; text-decoration: none; }
.resume-content table { border-collapse: collapse; width: 100%; }
.resume-content td, .resume-content th { padding: 2px 8px; text-align: left; }
.resume-content hr { border: none; margin: 8px 0; }
.resume-content p, .resume-content ul, .resume-content ol,
.resume-content h1, .resume-content h2, .resume-content h3 { margin: 0; padding: 0; }
.resume-content ul, .resume-content ol { padding-left: 18px; }
.resume-content li { margin-bottom: 2px; }
`;

const TEMPLATE_CSS: Record<string, string> = {
  classic: `
[data-template="classic"] .resume-content { font-family: "Crimson Text", serif; font-size: 15.33px; }
[data-template="classic"] .resume-content h1 { font-size: 24px; font-weight: 700; text-align: center; margin-bottom: 4px; }
[data-template="classic"] .resume-content h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid #000; margin-bottom: 8px; margin-top: 16px; }
[data-template="classic"] .resume-content h3 { font-size: 15.33px; font-weight: 700; margin-top: 8px; margin-bottom: 2px; }
[data-template="classic"] .resume-content p { margin-bottom: 4px; }
[data-template="classic"] .resume-content ul, [data-template="classic"] .resume-content ol { list-style: disc; padding-left: 18px; }
[data-template="classic"] .resume-content hr { border-top: 1px solid #000; }
`,
  modern: `
[data-template="modern"] .resume-content { font-family: "Inter", system-ui, sans-serif; font-size: 14px; }
[data-template="modern"] .resume-content h1 { font-size: 26.67px; font-weight: 600; text-align: left; margin-bottom: 4px; }
[data-template="modern"] .resume-content h2 { font-size: 14.67px; font-weight: 600; color: #2563EB; margin-top: 12px; margin-bottom: 6px; }
[data-template="modern"] .resume-content h3 { font-size: 14px; font-weight: 600; margin-top: 6px; margin-bottom: 2px; }
[data-template="modern"] .resume-content p { margin-bottom: 3px; }
[data-template="modern"] .resume-content ul { list-style: none; padding-left: 12px; border-left: 2px solid #E5E7EB; }
[data-template="modern"] .resume-content hr { display: none; }
`,
  minimal: `
[data-template="minimal"] .resume-content { font-family: "Inter", system-ui, sans-serif; font-size: 13.33px; }
[data-template="minimal"] .resume-content h1 { font-size: 18.67px; font-weight: 600; margin-bottom: 2px; }
[data-template="minimal"] .resume-content h2 { font-size: 13.33px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #6B7280; margin-top: 8px; margin-bottom: 4px; }
[data-template="minimal"] .resume-content h3 { font-size: 13.33px; font-weight: 600; margin-top: 4px; margin-bottom: 1px; }
[data-template="minimal"] .resume-content p { margin-bottom: 2px; }
[data-template="minimal"] .resume-content ul { list-style-type: "- "; padding-left: 12px; }
[data-template="minimal"] .resume-content hr { border-top: 0.5px solid #D1D5DB; }
`,
  technical: `
[data-template="technical"] .resume-content { font-family: "JetBrains Mono", monospace; font-size: 12.67px; }
[data-template="technical"] .resume-content h1 { font-size: 18.67px; font-weight: 700; margin-bottom: 4px; }
[data-template="technical"] .resume-content h2 { font-size: 13.33px; font-weight: 700; border-bottom: 2px solid #000; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px; }
[data-template="technical"] .resume-content h3 { font-size: 12.67px; font-weight: 700; margin-top: 6px; margin-bottom: 2px; }
[data-template="technical"] .resume-content p { margin-bottom: 3px; }
[data-template="technical"] .resume-content ul { list-style: none; padding-left: 18px; }
[data-template="technical"] .resume-content li::before { content: "> "; }
[data-template="technical"] .resume-content hr { border-top: 1px dashed #9CA3AF; }
`,
  compact: `
[data-template="compact"] .resume-content { font-family: "Inter", system-ui, sans-serif; font-size: 12.67px; column-count: 2; column-gap: 24px; }
[data-template="compact"] .resume-content > h1 { font-size: 18.67px; font-weight: 700; text-align: left; margin-bottom: 2px; column-span: all; }
[data-template="compact"] .resume-content > h1 + p { column-span: all; }
[data-template="compact"] .resume-content > hr:first-of-type { column-span: all; visibility: hidden; height: 0; margin: 0; }
[data-template="compact"] .resume-content h2 { font-size: 12.67px; font-weight: 700; text-transform: uppercase; margin-top: 8px; margin-bottom: 4px; }
[data-template="compact"] .resume-content h3 { font-size: 12.67px; font-weight: 600; margin-top: 4px; margin-bottom: 1px; }
[data-template="compact"] .resume-content p { margin-bottom: 2px; }
[data-template="compact"] .resume-content ul { list-style: disc; padding-left: 14px; }
[data-template="compact"] .resume-content hr { border-top: 0.5px solid #D1D5DB; }
[data-template="compact"] .resume-content h2, [data-template="compact"] .resume-content h3 { break-inside: avoid; }
`,
};

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
  templateId: string;
  scaleFactor: number;
  paperSize: "us-letter" | "a4";
}

export function buildHtmlDocument(params: BuildHtmlParams): string {
  const { renderedHtml, templateId, scaleFactor, paperSize } = params;

  const paperWidthPx = PAPER_WIDTHS[paperSize] ?? PAPER_WIDTHS["us-letter"];
  const contentWidth = Math.round(100 / scaleFactor);

  // Google Fonts CDN fallback (used when local woff2 files are not present)
  const googleFontsLink = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap" rel="stylesheet">`;

  const fontFaceBlock = buildFontFaceBlock();
  // If we have local fonts embedded as data URIs, skip the CDN link
  const fontStyleTag = fontFaceBlock
    ? `<style>${fontFaceBlock}</style>`
    : googleFontsLink;

  const templateCss = TEMPLATE_CSS[templateId] ?? TEMPLATE_CSS["classic"];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${fontStyleTag}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: white; }
${BASE_CSS}
${templateCss}
</style>
</head>
<body>
<div class="paper" data-template="${templateId}" style="width: ${paperWidthPx}px; padding: 48px;">
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
