## Overview

PDF export is the primary paid gate in BragSheet. Server-side Puppeteer renders the resume as a pixel-perfect one-page PDF matching the client preview exactly. Free users see an "Upgrade to export" button; paid users get a direct download. The export runs as a Cloud Function triggered via the `POST /api/pdf/generate` endpoint.

## Dependencies

- `03_API_Endpoints.md` -- `POST /api/pdf/generate` endpoint specification
- `07_One_Page_Constraint.md` -- Scale factor applied during rendering
- `08_Template_System.md` -- Template CSS loaded into Puppeteer
- `02_Database_Schema.md` -- `resumes` document for content, `users.subscription` for paid gate
- `15_Profile_Analytics.md` -- `analytics.pdfDownloads` incremented on export
- `14_Stripe_Billing.md` -- Subscription status check

## Paid Gate

| User Tier | Export Button Label | Behavior |
|-----------|-------------------|----------|
| Free | "Upgrade to export" | Opens Stripe checkout flow (see `14_Stripe_Billing.md`) |
| Paid (`subscription.status === "active"`) | "Export PDF" | Triggers PDF generation |
| Past due (`subscription.status === "past_due"`) | "Export PDF" (disabled) | Tooltip: "Payment past due. Update billing to export." Links to Stripe portal |

The button lives in the editor nav bar (see `06_Markdown_Editor.md`). Gate enforcement happens both client-side (button state) and server-side (Cloud Function returns 403 for non-paid users).

## Export Flow

### Client Side

1. User clicks "Export PDF"
2. Button enters loading state: spinner icon replaces download icon, button disabled, text changes to "Generating..."
3. Client sends `POST /api/pdf/generate` with Firebase Auth ID token and `resumeId`
4. On success: browser triggers file download from the response binary stream
5. On failure: toast error with retry suggestion
6. Button returns to default state

### Server Side (Cloud Function)

1. Verify Firebase Auth token from `Authorization` header
2. Fetch `users` document, check `subscription.status === "active"` -- return 403 if not
3. Fetch `resumes` document by `resumeId`, verify `userId` matches auth UID -- return 403 if mismatch
4. Build HTML document (see Rendering Pipeline below)
5. Launch Puppeteer, render HTML, generate PDF
6. Increment `analytics.pdfDownloads` via admin SDK
7. Return PDF binary with appropriate headers

### Response Headers

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="{username}-resume.pdf"
Cache-Control: no-store
```

Filename uses the user's username slug. Example: `jane-doe-resume.pdf`. If the user has multiple variants, append the variant title: `jane-doe-frontend-resume.pdf` (slugified from `resumes.title`).

## Rendering Pipeline

The server reconstructs the same HTML the client preview displays:

### Step 1: Build HTML Document

```
<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
  <style>{base.css}</style>
  <style>{template.css}</style>
  <style>{scale-override}</style>
</head>
<body>
  <div class="paper" data-template="{templateId}">
    <div class="resume-content" style="transform: scale({scaleFactor}); transform-origin: top left; width: {100/scaleFactor}%">
      {rendered HTML from markdown}
    </div>
  </div>
</body>
</html>
```

### Step 2: Markdown to HTML

Use the same remark pipeline as the client (see `06_Markdown_Editor.md`):

```
markdown -> remark-parse -> remark-gfm -> remark-breaks -> remark-rehype -> rehype-sanitize -> rehype-stringify -> HTML string
```

Share this pipeline as a common module between the client app and Cloud Functions. Do NOT maintain two separate markdown renderers.

### Step 3: Apply Template Styles

Load the template CSS file matching `resumes.templateId`. Same CSS files used by the client (see `08_Template_System.md`). Injected as an inline `<style>` block in the HTML document.

### Step 4: Apply Scale Factor

Read `resumes.overflow.scaleFactor` from the document. Apply as a CSS transform on the `.resume-content` wrapper. If `scaleFactor` is `1.0`, no transform is applied.

### Step 5: Puppeteer PDF Generation

```
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setContent(htmlString, { waitUntil: 'networkidle0' });
const pdf = await page.pdf({
  width: paperWidth,
  height: paperHeight,
  printBackground: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
});
await browser.close();
return pdf;
```

**Paper dimensions for `page.pdf()`:**

| Paper Size | Width | Height |
|------------|-------|--------|
| US Letter | `8.5in` | `11in` |
| A4 | `210mm` | `297mm` |

Margins are set to `0` because the HTML document handles its own padding (48px inside the `.paper` container). Puppeteer margins would add extra space outside the paper area.

`printBackground: true` is required for templates that use background colors (e.g., Modern's blue heading accents).

`waitUntil: 'networkidle0'` ensures Google Fonts are fully loaded before PDF capture.

## Cloud Function Configuration

| Setting | Value | Reason |
|---------|-------|--------|
| Memory | 1GB | Puppeteer requires ~500MB minimum |
| Timeout | 60 seconds | Font loading + render can take 5-15s, especially on cold start |
| Region | `us-central1` | Matches Firestore region |
| Min instances | 0 at MVP | Cold starts are acceptable; set to 1 if budget allows to reduce latency |
| Concurrency | 1 | Puppeteer is single-threaded per instance |

### Puppeteer in Cloud Functions

Use `puppeteer-core` with `@sparticuz/chromium` for a Cloud Functions-compatible Chromium binary. The full `puppeteer` package bundles Chromium at ~280MB, which exceeds Cloud Functions deployment limits. `@sparticuz/chromium` provides a compressed binary (~50MB) that decompresses at runtime.

## Error Handling

| Error | HTTP Status | User-Facing Message |
|-------|-------------|---------------------|
| Not authenticated | 401 | (Shouldn't reach here -- client checks auth) |
| Free tier user | 403 | "Upgrade to Pro to export PDFs" |
| Resume not found | 404 | "Resume not found" |
| Resume not owned by user | 403 | "You don't have access to this resume" |
| Puppeteer crash | 500 | "PDF generation failed. Please try again." |
| Timeout | 500 | "PDF generation timed out. Please try again." |
| Font loading failure | 500 | (Falls back to system fonts -- generates PDF anyway, may look different) |

On 500 errors, the client shows a toast with "Try again" action button. The operation is safe to retry.

## Font Loading Strategy

Google Fonts must be available in the Puppeteer environment. Two approaches:

**Option A (recommended): Embed font files**
- Download font files (woff2) for all template fonts at build time
- Include in the Cloud Functions deployment
- Reference via `@font-face` with local file paths in the HTML `<style>` block
- Eliminates network dependency during PDF generation

**Option B: Load from CDN**
- Include Google Fonts `<link>` in the HTML head
- `waitUntil: 'networkidle0'` ensures fonts load before capture
- Adds 1-3s to generation time, depends on network
- Risk of failure if CDN is slow or blocked

Use Option A for reliability. Bundle the woff2 files for Crimson Text (400, 700), Inter (400, 500, 600), and JetBrains Mono (400) in the functions deployment.

## Rate Limiting

No per-user rate limiting at MVP. Natural throttles:

- Cloud Function concurrency of 1 per instance means concurrent requests queue
- Typical generation time of 3-10s discourages rapid repeated exports
- Stripe billing ensures only paid users hit the endpoint

If abuse occurs, add a simple rate limit: max 10 PDF exports per user per hour, enforced in the Cloud Function by checking a counter in the user's document or a short-lived Firestore document.

## Gaps & Assumptions

- **PDF file size**: A single-page text-based PDF with embedded fonts is typically 50-200KB. No compression needed at MVP. If file sizes are unexpectedly large, investigate Puppeteer's font subsetting.
- **Watermark for free tier**: No watermarked PDF for free users at MVP. Free users cannot export at all. A watermarked free export could be a growth lever later -- deferred to `19_Future_Features.md`.
- **Batch export**: No batch export of multiple variants as a single PDF or ZIP at MVP. Each variant exports individually.
- **Export history**: No record of past exports beyond the `pdfDownloads` counter. Users re-export as needed.
- **Profile photo in PDF**: If the user has a profile photo, it is NOT included in the PDF. The resume is text-only. Photos in resumes are culturally discouraged in many markets and create ATS parsing issues.
- **Puppeteer version pinning**: Pin `@sparticuz/chromium` to a specific version in `package.json`. Chromium updates can change rendering behavior. Test PDF output visually after any dependency update.
- **A/B testing paper sizes**: A user could export the same resume in both US Letter and A4. The endpoint accepts a `paperSize` override parameter for this purpose.  
