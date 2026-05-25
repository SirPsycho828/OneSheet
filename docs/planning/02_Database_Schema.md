## Overview

Firestore database schema for BragSheet. Six collections at MVP: `users`, `usernames`, `resumes`, `versions`, `analytics`, and `customers` (Stripe). Document relationships are flat with ID references -- no subcollections except `versions` under `resumes`.

## Dependencies

- `01_Auth.md` -- Auth states, onboarding flow, security rules context
- `14_Stripe_Billing.md` -- `customers` collection structure and webhook updates
- `10_Public_Profiles.md` -- `usernames` collection for slug resolution

## Collections

### `users`

**Purpose**: Core user profile and account state.

| Field | Type | Notes |
|-------|------|-------|
| `uid` | `string` | Document ID. Matches Firebase Auth UID |
| `email` | `string` | |
| `displayName` | `string` | From OAuth profile or email local part |
| `username` | `string` | Unique slug for public profile URL |
| `photoURL` | `string \| null` | Firebase Storage path if uploaded, OAuth profile URL otherwise |
| `onboardingComplete` | `boolean` | |
| `subscription` | `map` | See Subscription map below |
| `paperSize` | `string` | `"us-letter"` or `"a4"`. Default: `"us-letter"` |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |

**Subscription map:**

| Field | Type | Notes |
|-------|------|-------|
| `status` | `string` | `"free"`, `"active"`, `"past_due"`, `"canceled"` |
| `stripeCustomerId` | `string \| null` | Set by Stripe webhook |
| `stripePriceId` | `string \| null` | |
| `currentPeriodEnd` | `Timestamp \| null` | |

**Security rules:**
- Read/write: `request.auth.uid == documentId`
- `subscription` fields: writable only by Cloud Functions (admin SDK) via Stripe webhook

---

### `usernames`

**Purpose**: Enforces username uniqueness and enables fast slug-to-UID lookup for public profiles.

| Field | Type | Notes |
|-------|------|-------|
| _(document ID)_ | | The username string itself (e.g., `"jane-doe"`) |
| `uid` | `string` | Owner's Firebase Auth UID |
| `createdAt` | `Timestamp` | |

**Security rules:**
- Create: authenticated user, `request.auth.uid == request.resource.data.uid`, document must not exist
- Read: anyone (needed for public profile resolution and uniqueness checks)
- Update: denied (usernames are immutable at MVP)
- Delete: `request.auth.uid == resource.data.uid` (for future account deletion)

**Usage pattern**: During onboarding, client does a `getDoc('usernames/desired-slug')` to check availability, then batch-writes the username claim + user document update atomically. See `01_Auth.md`.

---

### `resumes`

**Purpose**: Stores resume content and metadata. One document per resume variant.

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Auto-generated document ID |
| `userId` | `string` | Owner's UID |
| `title` | `string` | User-defined name, e.g., "Frontend Resume". Default: `"My Resume"` |
| `markdown` | `string` | Raw markdown content |
| `templateId` | `string` | References a template key. Default: `"classic"` |
| `isDefault` | `boolean` | Which variant serves the public profile. Exactly one per user must be `true` |
| `paperSize` | `string` | `"us-letter"` or `"a4"`. Inherited from user preference, overridable per resume |
| `overflow` | `map` | Tracks one-page constraint state |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |

**Overflow map:**

| Field | Type | Notes |
|-------|------|-------|
| `isOverflowing` | `boolean` | Set by client-side measurement |
| `scaleFactor` | `number` | Current auto-scale value, `1.0` = no scaling. Floor: `0.75` (~9pt at 12pt base) |

**Security rules:**
- Read: `request.auth.uid == resource.data.userId` OR public read for the default resume (resolved via username lookup)
- Write: `request.auth.uid == resource.data.userId`
- Create: enforce max 3 documents per user (count query in security rules or Cloud Function)

---

### `versions` (subcollection of `resumes`)

**Purpose**: Auto-save snapshots for version history. Path: `resumes/{resumeId}/versions/{versionId}`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `string` | Auto-generated document ID |
| `markdown` | `string` | Snapshot of resume markdown at save time |
| `templateId` | `string` | Template at time of snapshot |
| `createdAt` | `Timestamp` | |

**Security rules:**
- Read/write: inherit from parent resume document's `userId` check
- Create: only via Cloud Function or client after debounced save

**Retention**: Keep last 50 versions per resume. Cleanup via scheduled Cloud Function (daily) that deletes oldest beyond 50. See `13_Version_History.md`.

---

### `analytics`

**Purpose**: Simple counters for profile views and PDF downloads. One document per resume.

| Field | Type | Notes |
|-------|------|-------|
| _(document ID)_ | | Same as the `resumes` document ID it tracks |
| `userId` | `string` | Denormalized for security rules |
| `profileViews` | `number` | Incremented via `FieldValue.increment(1)` |
| `pdfDownloads` | `number` | Incremented when PDF is generated |
| `lastViewedAt` | `Timestamp \| null` | |

**Security rules:**
- Read: `request.auth.uid == resource.data.userId`
- Update `profileViews`: anyone (public profiles increment on view). Constrain to increment-only: `request.resource.data.profileViews == resource.data.profileViews + 1`
- Update `pdfDownloads`: Cloud Functions only (admin SDK, during PDF generation)
- Create: by owner or Cloud Function when resume is created

See `15_Profile_Analytics.md` for counter increment patterns and abuse prevention.

---

### `customers`

**Purpose**: Stripe-managed customer data, written exclusively by Stripe webhooks via Cloud Functions.

| Field | Type | Notes |
|-------|------|-------|
| _(document ID)_ | | Firebase Auth UID |
| `stripeCustomerId` | `string` | |
| `stripeSubscriptionId` | `string \| null` | |
| `stripePriceId` | `string \| null` | |
| `status` | `string` | Mirrors `users.subscription.status` |
| `currentPeriodEnd` | `Timestamp \| null` | |
| `cancelAtPeriodEnd` | `boolean` | |
| `createdAt` | `Timestamp` | |
| `updatedAt` | `Timestamp` | |

**Security rules:**
- Read: `request.auth.uid == documentId`
- Write: denied (Cloud Functions admin SDK only)

**Why separate from `users`?** Keeps Stripe webhook writes isolated. The webhook updates `customers`, then syncs key fields (`status`, `currentPeriodEnd`) to `users.subscription`. If Stripe webhooks hit race conditions with user writes on the `users` doc, data stays consistent. See `14_Stripe_Billing.md`.

## Indexes

### Composite Indexes

| Collection | Fields | Purpose |
|------------|--------|---------|
| `resumes` | `userId` ASC, `createdAt` DESC | Dashboard: list user's resumes by creation date |
| `resumes` | `userId` ASC, `isDefault` ASC | Fast lookup of user's default resume for public profile |
| `resumes/{id}/versions` | `createdAt` DESC | Version history: newest first |

### Single-Field Indexes

Default Firestore single-field indexes are sufficient for all other queries. No exemptions needed.

## Data Relationships

```
users (1) ----< resumes (many)        via resumes.userId
users (1) ----> usernames (1)         via usernames[username].uid
resumes (1) --< versions (many)       subcollection
resumes (1) --> analytics (1)         shared document ID
users (1) ----> customers (1)         shared document ID (UID)
```

## Document Size Considerations

- **Resume markdown**: Firestore document max is 1MB. A one-page resume in markdown is typically 2-5KB. No risk of hitting limits.
- **Version snapshots**: Same size as resume content. 50 versions at 5KB each = 250KB per resume in subcollection. Negligible.
- **No arrays that grow unboundedly**: All arrays are fixed-size maps or capped by business logic.

## Gaps & Assumptions

- **Username changes**: Not supported at MVP. The `usernames` collection has no update rule. If needed later, requires deleting old + creating new in a transaction, plus updating all public profile URLs. Defer to `19_Future_Features.md`.
- **Soft delete**: No `deletedAt` field at MVP. Resume deletion is hard delete (document removed). If undo-delete is needed, version history subcollection could serve as a recovery mechanism.
- **Profile photo storage path**: Assumed `photos/{uid}/{filename}` in Firebase Storage. Max file size and accepted formats should be validated client-side (5MB max, JPEG/PNG/WebP). Storage security rules should enforce the same.
- **Analytics accuracy**: `profileViews` uses client-side increment with no deduplication. The same visitor refreshing the page increments the counter each time. Acceptable at MVP; deduplication via IP/session tracking deferred.
- **Resume variant limit enforcement**: Security rules should prevent creation of more than 3 resume documents per `userId`. This requires a `count()` query in security rules (Firestore supports `request.resource` count constraints) or enforcement via a Cloud Function. Cloud Function approach is more reliable.
- **Offline writes**: Firestore SDK handles offline queuing automatically. No special schema considerations needed, but `updatedAt` should use `serverTimestamp()` to ensure correct ordering when writes sync.  
