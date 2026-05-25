▸ Extended thinking (262 chars)  
## Overview

BragSheet auto-saves resume content as the user types. This file specifies how saves work, how failures are handled, how the user is informed of save state, and how data loss is prevented. The save system must be invisible when working correctly and clearly communicative when something goes wrong. No user should ever lose work without knowing about it.

## Dependencies

- `04_Editor.md` -- Editor triggers saves on content change
- `02_Database_Schema.md` -- `resumes` collection, `updatedAt` field
- `13_Version_History.md` -- Saves that meet threshold criteria also create version snapshots
- `03_API_Endpoints.md` -- Save endpoint (`PUT /api/resumes/:id`)
- `17_Mobile_Experience.md` -- Mobile save triggers (tab switch, blur)

## Auto-Save Mechanics

### Trigger

Every keystroke in the markdown editor starts a debounce timer. The save fires when the user pauses typing.

| Parameter | Value |
|-----------|-------|
| Debounce delay | 1500ms after last keystroke |
| Max delay (force save) | 10 seconds since last successful save if content has changed |
| Save on blur | Immediate (no debounce) when editor loses focus |
| Save on tab switch (mobile) | Immediate when switching from Edit to Preview tab |
| Save on page unload | `beforeunload` fires a synchronous save attempt via `navigator.sendBeacon` |

### What Gets Saved

Each save writes to `resumes/{resumeId}`:

| Field | Value |
|-------|-------|
| `markdown` | Full current content (not a diff) |
| `updatedAt` | `FieldValue.serverTimestamp()` |

Title and template changes save immediately on change (not debounced) since they're discrete actions, not continuous typing.

### Save Deduplication

Before sending a save request, compare the current markdown content to the last successfully saved content (kept in local state). If identical, skip the save. This prevents unnecessary writes when:

- User types and then undoes (content returns to saved state)
- Debounce fires but content hasn't actually changed
- Page regains focus but nothing was edited

## Save State Indicator

A small, unobtrusive indicator in the editor toolbar or status bar shows current save state:

| State | Display | Style |
|-------|---------|-------|
| Saved | "Saved" | `text-gray-400`, fades in then fades out after 2s |
| Saving | "Saving..." | `text-gray-400`, subtle pulse or spinner |
| Unsaved changes | "Unsaved" | `text-yellow-600`, appears after content changes but before save fires |
| Save failed | "Save failed – retrying" | `text-red-500`, persistent until resolved |
| Offline | "Offline – changes stored locally" | `text-orange-500`, persistent |

State transitions:

```
[Saved] → (user types) → [Unsaved] → (debounce fires) → [Saving] → (success) → [Saved]
                                                                    → (failure) → [Save failed]
```

## Error Handling: Network Failures

### Retry Strategy

When a save request fails (network error, timeout, 5xx response):

| Attempt | Delay | Notes |
|---------|-------|-------|
| 1st retry | 2 seconds | Immediate retry |
| 2nd retry | 5 seconds | Short backoff |
| 3rd retry | 15 seconds | Longer backoff |
| 4th retry | 30 seconds | |
| 5th+ retry | 60 seconds | Cap at 60s, continue indefinitely |

Retries continue as long as the editor is open. The user is never silently abandoned.

### During Retries

- Save indicator shows "Save failed – retrying" with the next retry countdown
- User can continue editing (new content is queued; only the latest content is sent on retry, not every intermediate version)
- If a retry succeeds, indicator flips to "Saved" and the retry counter resets

### User Intervention

After 3 failed retries, show a non-blocking banner below the toolbar:

```
Unable to save. Your changes are stored locally.
[Try now] [Dismiss]
```

"Try now" immediately fires a save attempt (resets retry counter). "Dismiss" hides the banner but retries continue in the background.

## Error Handling: Auth Expiration

Firebase Auth tokens expire after 1 hour. The SDK auto-refreshes them, but if refresh fails (e.g., user's account is disabled, or the refresh token is revoked):

1. Save request returns 401
2. Do NOT retry automatically (retries will also fail)
3. Show persistent banner: "Session expired. Please sign in again to save your work."
4. Provide a "Sign in" button that opens a modal or redirects to sign-in (preserving current content in memory)
5. Store current content in `localStorage` as backup before any redirect

## Error Handling: Conflict Detection

### How Conflicts Happen

Two tabs open, both editing the same resume. Tab A saves, then Tab B saves -- Tab B's save overwrites Tab A's changes. Or: a user edits on desktop while their agent updates via API simultaneously.

### Detection Mechanism

Each save request includes the client's last-known `updatedAt` timestamp:

```
PUT /api/resumes/:id
{
  "markdown": "...",
  "expectedUpdatedAt": "2026-05-25T14:30:00.000Z"
}
```

Server checks: if the document's current `updatedAt` is newer than `expectedUpdatedAt`, someone else saved in between. Return 409 Conflict.

### Conflict Resolution

On receiving a 409:

1. Fetch the current server version
2. Show a conflict modal:
   ```
   This resume was updated elsewhere.
   [Keep my version] [Load server version] [View both]
   ```
3. "Keep my version" -- force-saves the local content (overwrite server). Appropriate when the user knows their version is correct.
4. "Load server version" -- discards local changes, loads what's on the server. Appropriate when an agent or another tab has a better version.
5. "View both" -- shows a side-by-side comparison (local left, server right) using a simple split view. User manually reconciles by choosing one or copy-pasting between them.

No automatic merge. Markdown content doesn't have a merge-friendly structure (unlike structured data). Manual resolution is safer and clearer.

## Local Backup (localStorage)

### Purpose

Protect against catastrophic failures: browser crash, accidental tab close, power loss. The local backup is a last-resort recovery mechanism, not a primary save system.

### Implementation

On every debounce tick (same timing as the save request), write current content to `localStorage`:

```
Key: bragsheet_backup_{resumeId}
Value: JSON.stringify({ markdown, savedAt: Date.now() })
```

### Recovery

On editor page load:

1. Load resume from Firestore (source of truth)
2. Check `localStorage` for a backup of this resume
3. If backup exists AND `backup.savedAt > resume.updatedAt` (local is newer):
   - Show recovery banner: "Recovered unsaved changes from {relative time}. [Restore] [Discard]"
   - "Restore" replaces the editor content with the backup and triggers a save
   - "Discard" deletes the localStorage entry
4. If backup is older than or equal to server content, silently delete it

### Cleanup

- Delete the localStorage backup after every successful server save
- On successful page load (no recovery needed), delete any stale backup
- Backups older than 7 days are ignored and deleted on next page load

### Storage Limits

`localStorage` has a ~5MB limit per origin. A single resume at ~5KB is negligible. With 3 resumes, max backup footprint is ~15KB. No storage pressure concerns.

## Error Handling: API Endpoints

### Standard Error Response Format

All API endpoints return errors in a consistent structure (see `03_API_Endpoints.md`):

```json
{
  "error": {
    "code": "UPPER_SNAKE_CASE",
    "message": "Human-readable explanation"
  }
}
```

### Client-Side Error Handling by Status Code

| Status | Meaning | Client Behavior |
|--------|---------|-----------------|
| 400 | Invalid request | Show error message to user. Do not retry. |
| 401 | Auth expired/invalid | Trigger re-auth flow (see above) |
| 403 | Forbidden (tier, ownership) | Show upgrade prompt or "access denied" |
| 404 | Resume not found | Redirect to dashboard with "Resume not found" toast |
| 409 | Conflict | Trigger conflict resolution flow |
| 429 | Rate limited | Wait `Retry-After` seconds, then retry |
| 500 | Server error | Retry with backoff (same as network failure) |
| 503 | Service unavailable | Retry with backoff, show "service temporarily unavailable" |

### Toast Notifications for Non-Save Errors

Actions other than auto-save (delete resume, export PDF, change template) show toast notifications on failure:

- Position: bottom-center or top-right
- Duration: 5 seconds (errors), 3 seconds (success)
- Style: red background for errors, green for success
- Dismissible: click X or swipe away
- Actionable: include retry button where appropriate ("Export failed. [Retry]")

## Error Handling: PDF Export

PDF generation (see `09_PDF_Export.md`) can fail in ways unique to the rendering pipeline:

| Failure | Client Handling |
|---------|-----------------|
| Timeout (>30s) | "Export timed out. Try simplifying your resume content." |
| Puppeteer crash | "Export failed. Please try again." (server auto-recovers) |
| Content too long | "Resume content exceeds export limits. Reduce content length." |
| Service cold start | First request may be slow. Show progress indicator. No error unless >30s. |

## Error Handling: Onboarding

Username claim (see `07_Onboarding.md`) has specific error cases:

| Error | Display |
|-------|---------|
| Username taken | Inline under input: "This username is taken" (real-time check) |
| Invalid characters | Inline: "Only letters, numbers, and hyphens allowed" |
| Too short/long | Inline: "Must be 3-30 characters" |
| Network error during check | "Couldn't verify availability. Try again." |
| Race condition (claimed between check and submit) | Submit returns 409. Show: "Username was just taken. Choose another." |

## Offline Detection

### How

Listen to browser `online`/`offline` events and `navigator.onLine` for initial state:

```javascript
window.addEventListener('offline', () => setOffline(true));
window.addEventListener('online', () => setOffline(false));
```

### Behavior When Offline

- Save indicator switches to "Offline – changes stored locally"
- Saves write to localStorage only (no network requests attempted)
- When connection returns: immediately attempt to save the latest content to the server
- If the post-reconnection save succeeds, clear the offline state and show "Saved"
- If it fails (409 conflict because server was updated while offline), trigger conflict resolution

## beforeunload Guard

When the editor has unsaved changes (content differs from last successful save), register a `beforeunload` handler:

```javascript
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    // Also fire sendBeacon save attempt
    navigator.sendBeacon('/api/resumes/' + id + '/beacon-save', payload);
  }
});
```

The browser shows its native "Leave site? Changes you made may not be saved" dialog. The `sendBeacon` call is a best-effort background save that works even during page unload.

### Beacon Save Endpoint

`POST /api/resumes/:id/beacon-save` -- lightweight endpoint that accepts the same payload as the normal save but returns no response body. Optimized for `sendBeacon`'s fire-and-forget semantics. Must complete server-side processing regardless of whether the client is still connected.

## Gaps & Assumptions

- **No CRDT or OT**: No real-time collaboration. Conflict resolution is manual, last-write-wins with user confirmation. If collaborative editing is ever needed, the architecture would need a fundamental shift to operational transforms or CRDTs.
- **No undo across sessions**: Undo/redo is in-memory only (editor state). Closing the tab loses undo history. Version history (see `13_Version_History.md`) is the cross-session recovery mechanism for "I want to go back to yesterday's version."
- **sendBeacon reliability**: `navigator.sendBeacon` is best-effort. The browser may drop it under memory pressure or if the payload exceeds 64KB. A resume's markdown content should always be well under 64KB. If sendBeacon fails, the localStorage backup is the safety net.
- **No server-side validation of markdown**: The save endpoint accepts any string as markdown content. It does not validate markdown syntax, check for malicious content, or enforce length limits. Content length is bounded implicitly by the editor's UX (users won't type more than a few pages of resume content). If abuse becomes an issue, add a server-side max-length check (e.g., 50KB).
- **Multiple device editing**: If a user edits on phone and desktop simultaneously without closing either, conflicts will occur. The conflict resolution UI handles this, but there's no real-time presence indicator ("someone else is editing"). Acceptable for a single-user product where multi-device simultaneous editing is rare.  
