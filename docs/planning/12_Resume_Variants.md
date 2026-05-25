## Overview

Resume variants let users maintain different versions of their resume tailored to different job types (e.g., "Frontend," "Backend," "Startup"). Each variant is a separate Firestore document with its own markdown content, template, and version history. One variant is marked as the default and serves the public profile. Free users get 1 resume; paid users get up to 3.

## Dependencies

- `02_Database_Schema.md` -- `resumes` collection structure, `isDefault` field
- `11_Dashboard.md` -- Dashboard displays and manages variants
- `01_Auth.md` -- Onboarding creates the initial resume
- `14_Stripe_Billing.md` -- Tier limits on variant count
- `10_Public_Profiles.md` -- Default variant serves the public profile

## Tier Limits

| Tier | Max Resumes | Behavior at Limit |
|------|-------------|-------------------|
| Free | 1 | "New Resume" button hidden. Create card shows "Upgrade to Pro for multiple resumes" |
| Paid | 3 | "New Resume" button hidden. Create card shows "You've reached the 3-resume limit" |

Enforcement happens at two levels:

1. **Client-side**: Hide creation UI when at limit. Show appropriate message.
2. **Server-side**: Cloud Function or security rule rejects resume creation if count exceeds limit. This is the authoritative check -- client-side is a convenience.

### Server-Side Enforcement

Security rules cannot efficiently count documents per user. Use a Cloud Function for variant creation instead of direct client writes:

```
POST /api/resumes/create
Auth: Bearer token
Body: { title, templateId? }
```

The function:
1. Counts existing resumes for the user (`where userId == uid`)
2. Checks user's `subscription.status` to determine limit (1 or 3)
3. Rejects with 403 if at limit
4. Creates the document if under limit

This avoids race conditions where two rapid create requests could exceed the limit.

## Creating a Variant

### Flow

1. User clicks "+ New Resume" on dashboard or placeholder card
2. Modal appears with title input (placeholder: "e.g., Frontend, Backend, Startup")
3. User enters a title and clicks "Create"
4. Client calls `POST /api/resumes/create` with `{ title, templateId: "classic" }`
5. Server validates limit, creates document, returns `resumeId`
6. Client navigates to `/editor/{resumeId}`

### New Resume Document Defaults

| Field | Value |
|-------|-------|
| `userId` | Current user's UID |
| `title` | User-provided title |
| `markdown` | `""` (empty string) |
| `templateId` | `"classic"` (default template) |
| `isDefault` | `false` (first resume is `true`, all subsequent are `false`) |
| `paperSize` | Inherited from `users.paperSize` |
| `overflow.isOverflowing` | `false` |
| `overflow.scaleFactor` | `1.0` |
| `createdAt` | Server timestamp |
| `updatedAt` | Server timestamp |

An `analytics` document with the same ID is also created with zero counters.

## Default Resume

Exactly one resume per user must have `isDefault: true`. This resume is served at the public profile URL (`bragsheet.io/{username}`).

### Setting a New Default

When the user selects "Set as default" from a resume card's overflow menu (see `11_Dashboard.md`):

1. Client calls `POST /api/resumes/set-default` with `{ resumeId }`
2. Server verifies the user owns the resume
3. Batched write: set `isDefault: false` on the current default, `isDefault: true` on the new one
4. Return success
5. Dashboard updates both cards to reflect the change

**Must be a batched write** to prevent a state where zero or two resumes are marked default.

### Invariants

- A user always has exactly one default resume
- Deleting the default resume is a special case (see Deletion below)
- Creating the first resume sets it as default automatically
- Creating subsequent resumes sets them as non-default

## Renaming a Variant

Inline rename from the dashboard card's overflow menu:

1. Card title becomes an editable text input
2. User types new name, presses Enter or clicks away to confirm
3. Client updates `resumes.title` and `resumes.updatedAt` directly via Firestore SDK
4. No server-side validation on title content beyond basic length (1-100 chars, trimmed)

Title does not affect the public profile URL. The URL uses the username, not the resume title.

## Duplicating a Variant

From the dashboard card's overflow menu:

1. Client calls `POST /api/resumes/create` with `{ title: "{original} (copy)", templateId, markdown }` -- sends the source resume's content
2. Server validates limit (same as regular creation)
3. Creates a new document with the duplicated content
4. New resume is NOT default
5. Version history is NOT copied -- the duplicate starts with a clean history
6. Dashboard refreshes to show the new card

If the user is at their variant limit, the "Duplicate" option is disabled with a tooltip: "Resume limit reached."

## Deletion

From the dashboard card's overflow menu:

### Standard Deletion (Non-Default Resume)

1. Confirmation dialog: "Delete '{title}'? This can't be undone. All version history will also be deleted."
2. On confirm, Cloud Function `DELETE /api/resumes/{resumeId}`:
   - Verify ownership
   - Delete all documents in `resumes/{resumeId}/versions` subcollection
   - Delete `analytics/{resumeId}` document
   - Delete `resumes/{resumeId}` document
   - Return success
3. Dashboard removes the card

### Deleting the Default Resume

Only possible when the user has 2+ resumes (the last resume cannot be deleted -- see below).

1. Same confirmation dialog plus: "Your public profile will switch to '{other resume title}'."
2. Cloud Function:
   - Delete the resume and its subcollections (same as standard)
   - Find the user's remaining resumes, set the most recently updated one as the new default (`isDefault: true`)
   - Return the new default's ID
3. Dashboard refreshes

### Last Resume Protection

The user's final remaining resume cannot be deleted. The "Delete" option is disabled with tooltip: "Can't delete your only resume." This prevents a zero-resume state that would break the editor routing and public profile.

## Switching Between Variants in the Editor

When editing one variant and wanting to switch to another:

- Editor nav menu includes a "My Resumes" link to the dashboard
- No direct variant switcher dropdown in the editor at MVP -- go through the dashboard
- URL changes from `/editor/{resumeIdA}` to `/editor/{resumeIdB}`

A direct variant switcher in the editor nav (dropdown of variant titles) is a post-MVP enhancement. With a max of 3 variants, the extra dashboard trip is acceptable.

## Data Independence

Each variant is fully independent:

| Aspect | Shared or Independent |
|--------|-----------------------|
| Markdown content | Independent |
| Template selection | Independent |
| Paper size | Independent (defaults from user preference, overridable) |
| Version history | Independent (subcollection per resume) |
| Analytics | Independent (separate analytics document) |
| Overflow/scale factor | Independent |
| Public profile | Only the default variant is shown |

Changing one variant never affects another. There is no "sync sections across variants" feature.

## Upgrade Flow

When a free user tries to create a second resume:

1. Creation UI shows "Upgrade to Pro for multiple resumes" instead of the title input modal
2. CTA button: "Upgrade to Pro" -- triggers Stripe checkout (see `14_Stripe_Billing.md`)
3. After successful upgrade, `subscription.status` becomes `"active"`
4. User returns to dashboard, creation UI is now available
5. Limit is now 3

No partial upgrade or per-variant pricing. The paid tier unlocks all features including the 3-variant limit.

## Gaps & Assumptions

- **Variant limit of 3**: Chosen as a reasonable MVP ceiling. If users consistently request more, increase the limit or make it configurable per plan. Changing from 3 to 5 is a one-line constant change and a security rule update.
- **No variant templates**: All variants use the same template pool. There's no concept of "variant-specific templates" or template bundles. Each variant independently picks from the available templates.
- **No variant comparison**: No side-by-side view of two variants at MVP. Users who want to compare open two browser tabs.
- **Content suggestions across variants**: No "this bullet point is in your Frontend resume but not your Backend one" intelligence. Each variant is a standalone document.
- **Import between variants**: No "copy a section from variant A to variant B" feature. Users copy-paste markdown manually in the editor. A clipboard/snippet feature could be useful post-MVP.
- **Variant-specific public URLs**: Only the default variant has a public URL. No `bragsheet.io/jane-doe/frontend` paths at MVP. If users request per-variant public links, it would require changes to the URL structure and `usernames` resolution in `10_Public_Profiles.md`.  
