## Overview

BragSheet auto-saves version snapshots of resume content so users can browse and restore previous versions. Versions are stored as a subcollection under each resume document. The system captures snapshots on meaningful save events -- not on every keystroke. Users access version history from the editor to browse, preview, and restore any prior version.

## Dependencies

- `02_Database_Schema.md` -- `resumes/{resumeId}/versions` subcollection schema
- `06_Markdown_Editor.md` -- Auto-save triggers that create snapshots
- `03_API_Endpoints.md` -- Version list and restore endpoints
- `04_UI_Design_System.md` -- Side panel and list styling

## Snapshot Creation

### When Snapshots Are Created

Not every auto-save creates a version. Snapshots capture meaningful checkpoints:

| Trigger | Condition |
|---------|-----------|
| Manual save | `Ctrl/Cmd + S` -- always creates a snapshot |
| Idle threshold | 5 minutes of inactivity after changes -- the next auto-save (when user resumes typing) creates a snapshot |
| Template switch | Changing `templateId` creates a snapshot of the state before the switch |
| Restore | Restoring a version creates a snapshot of the current state before overwriting (so restore is reversible) |
| Session start | First auto-save after opening the editor creates a snapshot (captures state at session start) |

Regular auto-saves (2-second debounce from `06_Markdown_Editor.md`) update the `resumes` document but do NOT create version snapshots. This prevents flooding the subcollection with near-identical versions during active editing.

### Snapshot Contents

Each version document in `resumes/{resumeId}/versions/{versionId}`:

| Field | Value |
|-------|-------|
| `id` | Auto-generated document ID |
| `markdown` | Full markdown content at snapshot time |
| `templateId` | Template in use at snapshot time |
| `createdAt` | Server timestamp |

Snapshots store the complete markdown string, not diffs. Resume content is small (2-5KB) and diff-based reconstruction adds complexity for minimal storage savings. Full snapshots mean any version can be restored independently without replaying a chain.

### Client-Side Snapshot Logic

Track a `lastSnapshotAt` timestamp in local component state (not persisted to Firestore). When an auto-save fires:

```
if (contentChanged && shouldCreateSnapshot):
    write to resumes/{resumeId}/versions subcollection
    update lastSnapshotAt
```

`shouldCreateSnapshot` evaluates the triggers above:
- `isManualSave === true` OR
- `now - lastSnapshotAt > 5 minutes` OR
- `templateId changed` OR
- `isRestore === true` OR
- `isFirstSaveInSession === true`

## Version List UI

### Access Point

"Version History" option in the editor nav overflow menu (kebab menu). See `06_Markdown_Editor.md`.

### Panel Layout

Version history opens as a right-side slide-over panel that overlaps the preview panel:

```
+----------------------------+------------------------------+
|                            | Version History        [X]  |
|   Markdown Input           |------------------------------|
|   (unchanged)              | ● May 25, 2:30 PM          |
|                            |   Template: Classic          |
|                            |                              |
|                            | ○ May 25, 11:15 AM          |
|                            |   Template: Modern           |
|                            |                              |
|                            | ○ May 24, 4:45 PM           |
|                            |   Template: Classic          |
|                            |                              |
|                            | [Load more]                  |
+----------------------------+------------------------------+
```

- Panel width: `w-80` (320px) on desktop
- `bg-white border-l border-gray-200`
- Header: "Version History" title + close button (X icon)
- Scrollable list of version entries
- Close button or clicking outside closes the panel and returns to normal preview

### Version Entry

Each entry in the list:

| Element | Detail |
|---------|--------|
| Dot indicator | `●` filled for selected/active, `○` outline for others. `text-brand-500` for selected |
| Timestamp | Relative or absolute based on age. "2:30 PM" for today, "May 24, 4:45 PM" for this year, "Dec 15, 2025" for older |
| Template name | `text-xs text-gray-500`. Only shown if it differs from the current template |
| Click behavior | Selecting a version loads its content into the preview panel (temporary preview, not a restore) |

### Version Preview

When a user clicks a version entry:

1. The preview panel shows that version's rendered content (replacing the current resume preview)
2. The markdown input panel remains unchanged (still shows current content)
3. A banner appears at the top of the preview: "Viewing version from {timestamp}" with two buttons: "Restore this version" (primary) and "Back to current" (secondary)
4. The user can click through different versions to compare visually

This is a non-destructive preview. Nothing changes until the user explicitly clicks "Restore."

## Restore Flow

When the user clicks "Restore this version":

1. Client calls `POST /api/resumes/{resumeId}/versions/restore` with `{ versionId }`
2. Server creates a snapshot of the current state (so restore is reversible)
3. Server copies the version's `markdown` and `templateId` to the parent resume document
4. Server updates `resumes.updatedAt`
5. Client receives success response
6. Editor reloads with the restored content in both the markdown input and preview
7. Version history panel closes
8. Toast: "Version restored"

The newly created "pre-restore" snapshot appears at the top of the version list on next open, so the user can undo the restore.

## Pagination

Versions are loaded in pages to avoid fetching the entire history:

- Initial load: 20 versions, ordered by `createdAt` DESC (newest first)
- "Load more" button at the bottom fetches the next 20
- Uses Firestore cursor-based pagination (`startAfter` the last document's `createdAt`)
- Maximum fetchable: 50 versions (matches retention limit)

## Retention and Cleanup

### Retention Limit

Keep the last 50 versions per resume. This provides roughly 2-4 weeks of history for an active user.

### Cleanup Mechanism

A scheduled Cloud Function runs daily:

1. For each resume document, query `versions` subcollection ordered by `createdAt` DESC
2. If count > 50, delete the oldest documents beyond 50
3. Use batched deletes (Firestore batch limit: 500 operations, well within range)

### Cleanup Function Configuration

| Setting | Value |
|---------|-------|
| Schedule | Daily at 03:00 UTC |
| Memory | 256MB (lightweight) |
| Timeout | 120 seconds |
| Region | `us-central1` |

### Scaling Consideration

The cleanup function iterates over all resumes. At MVP scale (hundreds to low thousands of users), this is fine. If the user base grows significantly, add a `lastVersionCleanup` timestamp to the resume document and only process resumes that have been updated since the last cleanup.

## Deletion Cascade

When a resume variant is deleted (see `12_Resume_Variants.md`), its entire `versions` subcollection must also be deleted. Firestore does not cascade-delete subcollections automatically.

The resume deletion Cloud Function must:
1. List all documents in `resumes/{resumeId}/versions`
2. Delete them in batches
3. Then delete the parent resume document

Use `firestore.recursiveDelete()` from the admin SDK if available, or manual batch iteration.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Empty resume (no content) | No version created. Snapshots only fire when `contentChanged` is true |
| User restores then immediately restores again | Each restore creates a pre-restore snapshot. Chain of restores creates a chain of snapshots. No special handling needed |
| Two tabs open on same resume | Both tabs may create snapshots. Duplicate content in version history is harmless -- cleanup eventually trims to 50 |
| Version with a template that was later removed | Render with fallback to `classic` template. Show "(template unavailable)" in the version list |

## Gaps & Assumptions

- **No diff view**: Version history shows full content preview, not a diff between versions. A side-by-side diff view (highlighting what changed) is a post-MVP enhancement. With a one-page resume, users can visually compare by clicking between versions.
- **No named versions**: Versions are identified by timestamp only. Users cannot name or bookmark specific versions (e.g., "Sent to Google"). A tagging or naming feature is deferred to `19_Future_Features.md`.
- **No version sharing**: Versions are private to the user. No public URL for a specific version. The public profile always shows the current default resume.
- **Storage cost**: 50 versions at ~5KB each = ~250KB per resume. With 3 resumes per user, that's ~750KB per user. At 10,000 users: ~7.5GB of version data. Well within Firestore's practical limits and cost model.
- **Subcollection vs top-level collection**: Versions are a subcollection (`resumes/{id}/versions`) rather than a top-level collection with a `resumeId` field. This provides natural data locality, simpler security rules (inherit parent's `userId` check), and automatic cleanup scoping. The trade-off is that cross-resume version queries are impossible, which is acceptable since versions are always accessed per-resume.  
