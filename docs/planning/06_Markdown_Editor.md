## Overview

The markdown editor is the core product surface. A split-panel layout: raw markdown input on the left, live-rendered resume preview on the right at real paper dimensions. Content auto-saves to Firestore. The editor is where users spend 90% of their time in BragSheet.

## Dependencies

- `04_UI_Design_System.md` -- Editor layout, typography, spacing
- `02_Database_Schema.md` -- `resumes` collection for persistence, `overflow` map
- `07_One_Page_Constraint.md` -- Overflow detection and auto-scale behavior
- `08_Template_System.md` -- Template styles applied to the preview panel
- `13_Version_History.md` -- Snapshot creation on save
- `18_Error_Handling_Saves.md` -- Optimistic save behavior and toast triggers

## Layout

```
+-----------------------------------------------------------+
| Nav: Logo | Resume Title (editable) | Template | Export    |
+----------------------------+------------------------------+
|                            |                              |
|   Markdown Input           |   Live Preview               |
|   (JetBrains Mono 14px)   |   (Paper-sized, centered)    |
|                            |                              |
|                            |                              |
+----------------------------+------------------------------+
|                        Status Bar                         |
+-----------------------------------------------------------+
```

### Editor Nav

Slim top bar distinct from the landing page nav. Same `h-14` height.

| Element | Behavior |
|---------|----------|
| Logo | Links to dashboard (if multi-variant user) or reloads editor |
| Resume title | Inline-editable text field. Click to edit, blur to save. Shows title from `resumes.title` |
| Template button | Opens template picker overlay. Shows current template name. See `08_Template_System.md` |
| Export button | Primary CTA. "Export PDF" for paid users, "Upgrade to export" for free users. See `09_PDF_Export.md` |
| Share button | Copies public profile URL to clipboard. Toast: "Link copied" |
| Menu (kebab) | Overflow menu: Dashboard, Settings, Version History, Sign Out |

### Split Panels

- Default split: 50/50
- Resizable via drag handle between panels (thin `4px` grab area, `cursor-col-resize`)
- Minimum panel width: 320px per side
- User's split position is not persisted -- resets to 50/50 on page load
- Below `lg` breakpoint (1024px): panels stack vertically with Edit/Preview tab switcher. See `17_Mobile_Experience.md`

### Status Bar

Bottom bar, `h-8`, `bg-gray-50 border-t border-gray-200`, `text-xs text-gray-500`.

| Left | Right |
|------|-------|
| Save status: "Saved" / "Saving..." / "Offline -- changes saved locally" | Paper size indicator: "US Letter" or "A4" (clickable to toggle) |

## Markdown Input Panel

### Text Area

- Full-height textarea with `font-mono` (JetBrains Mono), `text-sm` (14px)
- No syntax highlighting at MVP. Plain monospaced text input. Syntax highlighting is a post-MVP enhancement (see `19_Future_Features.md`).
- Line numbers: not displayed at MVP
- Soft wrap enabled (no horizontal scrolling)
- `padding: 24px` inside the editor area

### Supported Markdown Features

Using `remark` with `remark-gfm` and `remark-breaks`:

| Feature | Syntax | Resume Use Case |
|---------|--------|-----------------|
| Headings | `# ## ###` | Section headers (Experience, Education, Skills) |
| Bold | `**text**` | Company names, job titles |
| Italic | `*text*` | Dates, locations |
| Unordered lists | `- item` | Bullet-point achievements |
| Ordered lists | `1. item` | Numbered accomplishments |
| Links | `[text](url)` | Portfolio, GitHub, LinkedIn |
| Horizontal rules | `---` | Section dividers |
| GFM tables | `\| col \|` | Skills matrices, certifications |
| Line breaks | Double newline or trailing `\\` | Content spacing |

**Not supported** (stripped or ignored in render):
- Images (no `![]()`  -- resumes don't embed images; profile photo handled separately)
- Code blocks (fenced or indented -- not relevant to resumes)
- HTML (raw HTML stripped for security and consistency)
- Blockquotes (not a standard resume element; if users request it, reconsider)

### Keyboard Behavior

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Force save (also triggers version snapshot) |
| `Ctrl/Cmd + Z` | Undo (native textarea undo) |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Tab` | Insert 2 spaces (prevent focus loss from textarea) |

No additional shortcuts at MVP. No toolbar buttons for bold/italic/heading -- the target audience knows markdown.

## Live Preview Panel

### Paper Container

The preview panel displays the rendered resume inside a paper-sized container:

- Container matches real paper dimensions per `04_UI_Design_System.md` (US Letter: 816x1056px, A4: 794x1123px)
- Centered in the preview panel with `bg-gray-50` behind it
- The paper itself is `bg-white shadow-lg`
- Scaled via CSS `transform: scale()` to fit the available panel width while preserving aspect ratio
- Padding inside the paper matches print margins: `padding: 48px` (0.5 inch equivalent at 96 DPI)

### Rendering Pipeline

```
User types -> markdown string
  -> remark parse (markdown to mdast)
  -> remark-gfm plugin (tables, strikethrough)
  -> remark-breaks plugin (soft line breaks)
  -> remark-rehype (mdast to hast)
  -> rehype-sanitize (strip disallowed HTML)
  -> rehype-react or rehype-stringify (hast to React elements or HTML)
  -> Apply template styles (CSS classes per template)
  -> Render in paper container
```

### Render Debounce

- Debounce markdown-to-HTML rendering by 150ms after last keystroke
- The textarea updates instantly (no lag); only the preview re-renders on debounce
- This prevents expensive remark pipeline runs on every keystroke

### Overflow Detection

After each render, measure the rendered content height against the paper container height:

- If content height > paper height: set `overflow.isOverflowing = true` on the resume document
- Apply auto-scale per `07_One_Page_Constraint.md`
- Show warning bar above preview per `04_UI_Design_System.md`

Measurement uses a hidden off-screen container at full scale (no CSS transform) to get accurate content height. The visible preview then applies both the scale-to-fit-panel transform and the overflow scale factor.

## Auto-Save

### Save Strategy

- Debounce saves: 2 seconds after last keystroke
- Save writes `markdown`, `templateId`, `overflow`, and `updatedAt` to the resume document
- Use Firestore's `updateDoc` with `serverTimestamp()` for `updatedAt`
- On `Ctrl/Cmd + S`: immediate save (bypass debounce) and create a version snapshot (see `13_Version_History.md`)

### Offline Behavior

- Firestore SDK handles offline persistence automatically when enabled
- Writes queue locally and sync when connection restores
- Status bar shows "Offline -- changes saved locally" when disconnected
- No custom offline logic needed beyond enabling Firestore persistence

See `18_Error_Handling_Saves.md` for error handling during saves.

## Initial Load

When the editor page mounts:

1. Fetch the resume document (by `resumeId` from URL param, or user's default resume)
2. If no resume exists (shouldn't happen post-onboarding, but defensive), create one with empty markdown and default template
3. Populate the textarea with `resume.markdown`
4. Render the preview
5. Start auto-save listener

Loading state: skeleton placeholder matching the two-panel layout (gray pulsing rectangles). See `04_UI_Design_System.md`.

## URL Structure

| Route | Behavior |
|-------|----------|
| `/editor` | Load user's default resume (where `isDefault === true`) |
| `/editor/:resumeId` | Load specific resume variant |

If a user has a single resume, `/editor` and `/editor/:resumeId` resolve to the same document. Multi-variant users access specific resumes via the dashboard (see `11_Dashboard.md`).

## Gaps & Assumptions

- **Textarea vs code editor library**: MVP uses a plain `<textarea>`. If users strongly request syntax highlighting, consider CodeMirror 6 or Monaco in a later phase, but these add significant bundle size (~200KB+). Keep it simple.
- **Collaborative editing**: Not supported. Single-user editing only. No conflict resolution needed.
- **Max content length**: No explicit character limit, but the one-page constraint naturally caps content at ~3,000-5,000 characters. If someone pastes a novel, the overflow system handles it gracefully.
- **Paste handling**: Plain text paste only. If a user pastes rich text (from Google Docs, etc.), strip formatting and insert as plain text. Use `onPaste` handler with `event.clipboardData.getData('text/plain')`.
- **Undo/redo history**: Native textarea undo is limited and resets on save. A more robust undo system (operational transform or state-based) is a post-MVP enhancement if users request it.
- **Preview scroll sync**: No synchronized scrolling between editor and preview at MVP. The preview always shows the full page. Since it's one page, scroll sync isn't critical.
- **Accessibility**: The textarea is natively accessible. The preview panel should have `aria-live="polite"` so screen readers announce content changes after render debounce.  
