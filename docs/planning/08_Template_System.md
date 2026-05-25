## Overview

BragSheet ships with 3-5 resume templates at MVP. Templates are CSS-only style variations applied to the same rendered HTML structure. Users select a template through a deliberate picker step before editing, and can switch anytime. Template styles must work identically in the browser preview and server-side PDF rendering.

## Dependencies

- `06_Markdown_Editor.md` -- Templates style the preview panel content
- `07_One_Page_Constraint.md` -- Templates affect content density and overflow behavior
- `09_PDF_Export.md` -- Template CSS shared between client and server rendering
- `04_UI_Design_System.md` -- Template picker UI follows app design patterns
- `02_Database_Schema.md` -- `resumes.templateId` stores selection

## Template Architecture

### How Templates Work

Templates are NOT separate layouts or component trees. The markdown rendering pipeline (see `06_Markdown_Editor.md`) produces the same HTML structure regardless of template. Templates are CSS stylesheets that apply different visual treatments to that shared structure.

```
Markdown -> remark pipeline -> Consistent HTML structure -> Template CSS -> Styled output
```

This means:
- Switching templates is instant (swap a CSS class, no re-render of markdown)
- All templates handle the same set of HTML elements (`h1`, `h2`, `h3`, `p`, `ul`, `li`, `a`, `hr`, `table`)
- Template CSS files are standalone -- no JavaScript logic per template

### HTML Structure Convention

The rendered resume HTML follows a predictable structure:

```
div.resume-content
  h1              -> Name
  p               -> Contact info / summary (first paragraph)
  h2              -> Section headers (Experience, Education, Skills)
  h3              -> Subsection headers (Job title, Degree)
  p               -> Body text, descriptions
  ul > li         -> Achievements, bullet points
  a               -> Links (portfolio, GitHub, etc.)
  hr              -> Section dividers
  table           -> Skills matrix, certifications
```

Templates must style ALL of these elements. Missing styles cause unstyled fallback rendering (browser defaults), which breaks the one-page constraint and looks broken.

### Template CSS File Structure

Each template is a single CSS file:

```
templates/
  classic.css
  modern.css
  minimal.css
  technical.css
  compact.css
```

Each file scopes all styles under a data attribute selector:

```css
[data-template="classic"] .resume-content h1 { ... }
[data-template="classic"] .resume-content h2 { ... }
```

Switching templates means changing the `data-template` attribute on the paper container. No class juggling, no dynamic imports.

### Shared vs Template-Specific CSS

**Shared** (in a `base.css` loaded by all templates):
- Paper container dimensions and margins
- Base `font-smoothing` and `text-rendering` for print quality
- Link color normalization (`color: inherit; text-decoration: none` -- resumes shouldn't have blue underlined links)
- Table border-collapse and base table styles

**Per-template**:
- Font family and sizes
- Heading styles (weight, case, borders, spacing)
- Section spacing and divider treatment
- List bullet style and indentation
- Color usage (most templates are monochrome)

## MVP Templates

### 1. Classic (`classic`)

The default template. Traditional resume appearance.

| Property | Value |
|----------|-------|
| Font | Crimson Text (serif), 11.5pt body |
| Headings | `h1`: 18pt bold centered. `h2`: 12pt uppercase, bottom border 1px solid black, `margin-bottom: 8px` |
| Sections | Generous spacing (`margin-top: 16px` between sections) |
| Lists | Standard disc bullets, `padding-left: 18px` |
| Dividers | `hr` renders as 1px solid black line |
| Color | Pure black text on white |
| Density | Medium -- fits moderate content before overflow |

### 2. Modern (`modern`)

Clean sans-serif with subtle color accent.

| Property | Value |
|----------|-------|
| Font | Inter, 10.5pt body |
| Headings | `h1`: 20pt, 600 weight, left-aligned. `h2`: 11pt, 600 weight, `color: #2563EB` (brand blue), no border |
| Sections | Tight spacing (`margin-top: 12px`) |
| Lists | No bullets -- left border `2px solid #E5E7EB` on `ul`, items as block text |
| Dividers | `hr` hidden (`display: none`) -- sections separated by heading color alone |
| Color | Black text, blue section headings |
| Density | Medium-high -- slightly more compact than Classic |

### 3. Minimal (`minimal`)

Maximum content density. For users with a lot to say.

| Property | Value |
|----------|-------|
| Font | Inter, 10pt body |
| Headings | `h1`: 14pt, 600 weight. `h2`: 10pt uppercase, `letter-spacing: 0.1em`, `color: #6B7280` (gray-500) |
| Sections | Tight spacing (`margin-top: 8px`) |
| Lists | Inline dash bullets (`"- "` prefix via `::marker`), minimal indentation (`padding-left: 12px`) |
| Dividers | `hr` as thin `0.5px solid #D1D5DB` |
| Color | Black text, gray headings |
| Density | High -- fits the most content before triggering overflow |

### 4. Technical (`technical`)

Monospace-influenced. Appeals to the developer audience.

| Property | Value |
|----------|-------|
| Font | JetBrains Mono, 9.5pt body |
| Headings | `h1`: 14pt, 700 weight. `h2`: 10pt, `border-bottom: 2px solid black`, `padding-bottom: 2px` |
| Sections | Medium spacing (`margin-top: 12px`) |
| Lists | `">"` prefix via `::before` pseudo-element, no standard bullets |
| Dividers | `hr` as dashed border `1px dashed #9CA3AF` |
| Color | Pure black and white |
| Density | Medium -- monospace fonts are wider, so less text fits per line |

### 5. Compact (`compact`)

Two-column layout for maximum information density.

| Property | Value |
|----------|-------|
| Font | Inter, 9.5pt body |
| Headings | `h1`: 14pt, 700 weight, left-aligned. `h2`: 9.5pt, uppercase, bold |
| Layout | `h1` and first `p` (contact/summary) span full width. Everything below `hr` (first occurrence) splits into two columns via `column-count: 2; column-gap: 24px` |
| Lists | Small disc bullets, `padding-left: 14px` |
| Dividers | First `hr` triggers column split (hidden itself). Subsequent `hr` as thin line within column flow |
| Color | Pure black and white |
| Density | Highest -- two columns fit the most content, but only works well for certain resume structures |

**Note**: The two-column layout in Compact is the only template with structural CSS beyond simple typography styling. It uses CSS `column-count`, not flexbox/grid, so it works in Puppeteer's print rendering without issues.

## Template Picker

### When It Appears

Per Step 3 decisions: template selection is a deliberate step before editing. The picker appears:

1. During onboarding, after username selection and before entering the editor
2. Anytime via the "Template" button in the editor nav (see `06_Markdown_Editor.md`)

### Picker UI

Full-screen overlay (`fixed inset-0 bg-white z-50`) with:

- Heading: "Choose a template"
- Grid of template cards: `grid-cols-3` on desktop, `grid-cols-2` on tablet, `grid-cols-1` on mobile
- Each card shows a live preview of the user's actual resume content rendered with that template (not placeholder content)
- Cards follow the paper aspect ratio (1 : 1.294 for US Letter)
- Active template has `ring-2 ring-brand-500` border
- Template name below each card: `text-sm font-medium`
- "Apply" button (primary) and "Cancel" button at bottom

### Live Preview in Picker

Each template card renders the current resume markdown through the remark pipeline with that template's CSS. This means five renders when the picker opens (one per template).

Performance consideration: render all five once on picker open, don't re-render as user browses. Cache the rendered HTML strings and swap CSS class for instant switching.

### Selection Behavior

- Clicking a template card selects it (visual highlight)
- "Apply" saves `templateId` to the resume document and closes the picker
- "Cancel" closes without saving
- Switching templates triggers overflow re-measurement (see `07_One_Page_Constraint.md`)

## Server-Side Consistency

Template CSS files must be available to both:
1. The client app (imported or loaded as stylesheets)
2. The Cloud Function PDF renderer (loaded into Puppeteer's page)

Store template CSS in a shared directory accessible to both builds. During PDF generation, inject the template CSS into the Puppeteer page via `page.addStyleTag()`. Use the same CSS file -- no separate "print" version.

Google Fonts used by templates (Crimson Text, JetBrains Mono, Inter) must be loaded in the Puppeteer environment. Use `page.goto` with font `<link>` tags in the HTML head, or pre-install fonts in the Cloud Functions environment.

## Free vs Paid Template Access

Per pricing decisions in `05_Landing_Page.md`:

| Tier | Access |
|------|--------|
| Free | 1 template (`classic` only) |
| Paid | All 5 templates |

Free users see all templates in the picker but locked templates show a subtle lock icon and "Upgrade to unlock" on click. They can preview their content in locked templates but cannot apply them.

## Gaps & Assumptions

- **Template design quality**: CSS values above are functional specifications, not final designs. Each template needs visual design polish during implementation. The specs provide the structural intent; pixel-perfect aesthetics come from iteration.
- **Custom templates**: Not supported at MVP. Users cannot create or modify templates. Deferred to `19_Future_Features.md`.
- **Template-specific markdown guidance**: Some templates work better with certain content structures (e.g., Compact needs an `---` to trigger the column split). No in-app guidance for this at MVP. Consider tooltip hints in the template picker post-MVP.
- **Font licensing**: Crimson Text (OFL), Inter (OFL), and JetBrains Mono (OFL) are all open-source fonts. No licensing issues.
- **RTL language support**: Not addressed at MVP. All templates assume LTR text direction.
- **Compact column breaks**: CSS `column-count` doesn't give fine control over where content breaks between columns. Content may split mid-section. Users can work around this with strategic `---` placement. A `break-inside: avoid` rule on `h2` + following content would help but may not be fully reliable.  
