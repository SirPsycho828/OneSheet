## Overview

The dashboard is the resume management hub for users with multiple resume variants. Users with a single resume bypass the dashboard entirely and land in the editor. The dashboard displays resume cards, lets users create new variants (up to the tier limit), set a default for their public profile, and access per-resume analytics.

## Dependencies

- `02_Database_Schema.md` -- `resumes` collection queries, `analytics` collection for view counts
- `01_Auth.md` -- Post-auth routing logic determines dashboard vs editor
- `12_Resume_Variants.md` -- Variant creation, limits, and default-setting behavior
- `04_UI_Design_System.md` -- Card patterns, empty states, layout
- `15_Profile_Analytics.md` -- Analytics data displayed on resume cards

## Routing Logic

The post-auth landing destination depends on resume count:

| Condition | Destination |
|-----------|-------------|
| User has 1 resume | `/editor` (skip dashboard) |
| User has 2+ resumes | `/dashboard` |
| User has 0 resumes | `/editor` (create default resume, shouldn't happen post-onboarding) |

This check runs on every auth state change. If a user creates a second variant from the editor, their next sign-in lands on the dashboard. If they delete down to one resume, next sign-in goes straight to the editor.

The dashboard is always accessible via the editor nav menu regardless of resume count. The routing logic only controls the post-auth landing.

## Page Layout

```
+----------------------------------------------------------+
| Nav: Logo | "My Resumes" | [Public Profile Link] | Menu  |
+----------------------------------------------------------+
|                                                          |
|  [+ New Resume]                          [Sort dropdown] |
|                                                          |
|  +----------------+  +----------------+  +----------+   |
|  | Resume Card    |  | Resume Card    |  | + Create |   |
|  | "Frontend"     |  | "Backend"      |  |   New    |   |
|  | Default ★      |  |                |  |          |   |
|  | 142 views      |  | 38 views       |  |          |   |
|  | Updated 2d ago |  | Updated 1w ago |  |          |   |
|  +----------------+  +----------------+  +----------+   |
|                                                          |
+----------------------------------------------------------+
```

### Nav Bar

Same app nav as the editor but with "My Resumes" as the page title instead of the resume title field.

| Element | Behavior |
|---------|----------|
| Logo | Reloads dashboard |
| Public profile link | `bragsheet.io/{username}` -- external link icon, opens in new tab |
| Menu (kebab) | Settings, Sign Out |

### Resume Grid

- `grid-cols-3` on desktop, `grid-cols-2` on tablet, `grid-cols-1` on mobile
- Gap: `gap-4`
- Max width: `max-w-5xl`, centered

## Resume Card

Each card represents one resume variant.

### Card Structure

```
+-------------------------------+
|  [Thumbnail preview]          |
|  (paper aspect ratio)         |
|                               |
+-------------------------------+
|  Title: "Frontend Resume"     |
|  ★ Default                    |
|  142 views · 8 downloads      |
|  Updated 2 days ago           |
|                               |
|  [Edit]  [···]                |
+-------------------------------+
```

### Card Elements

| Element | Detail |
|---------|--------|
| Thumbnail | Miniature render of the resume using its template. Static image generated on last save, not live-rendered. Aspect ratio matches paper size. `bg-white border border-gray-200 rounded-t-lg` |
| Title | `text-base font-semibold`, truncated with ellipsis if long |
| Default badge | Yellow star icon + "Default" text in `text-xs text-gray-500`. Only on the resume marked `isDefault: true` |
| Analytics summary | `text-xs text-gray-500`. Format: "{profileViews} views · {pdfDownloads} downloads". Data from `analytics` collection |
| Updated timestamp | `text-xs text-gray-500`. Relative time: "Updated 2 days ago". From `resumes.updatedAt` |
| Edit button | Secondary button. Navigates to `/editor/{resumeId}` |
| Overflow menu (···) | See Card Actions below |

### Card Actions (Overflow Menu)

| Action | Behavior |
|--------|----------|
| Set as default | Sets `isDefault: true` on this resume, `false` on current default. See `12_Resume_Variants.md` |
| Duplicate | Creates a copy with title "{original title} (copy)". Same content and template |
| Rename | Inline edit of the title field on the card |
| Delete | Confirmation dialog: "Delete '{title}'? This cannot be undone." Deletes resume document, its version history subcollection, and its analytics document |

**Set as default** is hidden on the card that is already default. **Delete** is disabled if it's the user's only resume (prevent zero-resume state).

## Create New Resume

Two entry points for creating a new variant:

1. **"+ New Resume" button** at the top of the page
2. **"+ Create New" placeholder card** at the end of the grid (visual affordance)

Both trigger the same flow:

1. Check variant limit (free: 1, paid: up to 3). If at limit, show upgrade prompt or "limit reached" message
2. Open a small modal: "New Resume" with a title input field (placeholder: "e.g., Frontend, Backend, Startup"), "Create" and "Cancel" buttons
3. On create: write new `resumes` document with empty markdown, default template (`classic`), `isDefault: false`
4. Navigate to `/editor/{newResumeId}`

The placeholder card is only visible when the user is below their variant limit.

## Thumbnail Generation

Resume thumbnails on cards are miniature previews of the rendered resume content.

### Strategy

Render thumbnails client-side on dashboard load:

1. For each resume, render the markdown through the remark pipeline with the resume's template CSS
2. Inject into a hidden container at paper dimensions
3. Scale down to card thumbnail size via CSS `transform`
4. Display as a live DOM element (not a static image)

### Performance

With a maximum of 3 resumes, this means 3 renders on dashboard load. Acceptable for MVP. If thumbnails cause jank:
- Render sequentially with `requestIdleCallback`
- Show skeleton placeholders while rendering

An alternative is generating static thumbnail images (as PNG) on save via a Cloud Function, stored in Firebase Storage. This is cleaner but adds infrastructure complexity. Defer to post-MVP unless client-side rendering is too slow.

## Sorting

Minimal sort options via a dropdown in the top-right:

| Option | Sort By | Default |
|--------|---------|---------|
| Last updated | `updatedAt` DESC | Yes (default) |
| Name | `title` ASC | |
| Most viewed | `analytics.profileViews` DESC | |

With a maximum of 3 resumes, sorting is nearly irrelevant. Include it for completeness but don't over-engineer. Client-side sort only (no Firestore query changes).

## Empty State

If a user has zero resumes (edge case -- should not happen post-onboarding):

- Centered content: "No resumes yet"
- Primary CTA: "Create your first resume" (same as "New Resume" flow)
- This is a defensive state. Onboarding creates the first resume (see `01_Auth.md`)

## Data Loading

On dashboard mount:

1. Query `resumes` where `userId == currentUser.uid`, ordered by `updatedAt` DESC
2. For each resume, fetch corresponding `analytics` document (same document ID)
3. Both queries happen in parallel

Loading state: 3 skeleton cards matching the card layout dimensions. See `04_UI_Design_System.md` for skeleton pattern.

Error state: "Couldn't load your resumes. Try refreshing." with a "Refresh" button.

## Real-Time Updates

No real-time listener on the dashboard at MVP. Data loads once on mount. If the user edits a resume and returns to the dashboard, a full reload fetches fresh data. This avoids unnecessary Firestore reads from active listeners on a page users visit briefly.

## Responsive Behavior

| Breakpoint | Grid | Card Size |
|------------|------|-----------|
| `lg` (1024px+) | 3 columns | Natural width |
| `md` (768-1023px) | 2 columns | Natural width |
| `sm` (below 768px) | 1 column, full width | Thumbnail hidden, content-only card |

On mobile, resume cards drop the thumbnail to save vertical space. Cards show: title, default badge, analytics summary, updated time, and action buttons in a compact horizontal row.

## Gaps & Assumptions

- **Thumbnail fidelity**: Client-side thumbnails at small scale may not be legible, but that's acceptable. They serve as visual identifiers (different templates look visually distinct at any scale), not as readable previews. Users who want to see the full resume click "Edit."
- **Bulk actions**: No multi-select or bulk operations at MVP. With a maximum of 3 resumes, bulk actions are unnecessary.
- **Drag-to-reorder**: Not supported. Sort order is automatic (last updated). Manual ordering is a post-MVP feature if users request it.
- **Dashboard analytics aggregate**: No "total views across all resumes" summary at MVP. Each card shows its own stats. An aggregate view could be added to a settings or analytics page later.
- **Delete confirmation**: Deletion is permanent -- no soft delete, no trash, no undo. The confirmation dialog is the safety net. Version history subcollection is also deleted (cascade delete via batched writes or a Cloud Function trigger).  
