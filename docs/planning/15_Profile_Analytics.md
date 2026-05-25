## Overview

BragSheet provides simple analytics for paid users: profile view counts and PDF download counts per resume. Data is stored as Firestore counters on an `analytics` document that shares its ID with the resume it tracks. No third-party analytics services, no time-series data, no visitor demographics. Just two numbers that answer "how many people saw my resume?"

## Dependencies

- `02_Database_Schema.md` -- `analytics` collection schema
- `10_Public_Profiles.md` -- Profile view increments happen during profile resolution
- `09_PDF_Export.md` -- PDF download increments happen during export
- `11_Dashboard.md` -- Analytics displayed on resume cards
- `14_Stripe_Billing.md` -- Analytics visibility gated to paid tier

## Data Model

One `analytics` document per resume, sharing the same document ID:

| Field | Type | Incremented By |
|-------|------|----------------|
| `profileViews` | `number` | Public profile endpoint (server-side) |
| `pdfDownloads` | `number` | PDF export endpoint (server-side) |
| `lastViewedAt` | `Timestamp \| null` | Public profile endpoint (server-side) |
| `userId` | `string` | Set on creation (denormalized for security rules) |

Both counters start at `0` when the analytics document is created alongside the resume.

## Profile View Counting

### When a View Is Counted

A profile view increments when the `GET /api/profile/:username` endpoint is called and returns a 200 response. This means:

- Direct browser visits to `bragsheet.io/{username}` count
- Social media crawler prefetches count (they hit the full endpoint)
- API consumers (agents) fetching the profile count
- Page refreshes count as separate views

### How the Increment Happens

Inside the `GET /api/profile/:username` Cloud Function, after resolving the resume and before returning the response:

```
admin.firestore()
  .doc(`analytics/${resumeId}`)
  .update({
    profileViews: FieldValue.increment(1),
    lastViewedAt: FieldValue.serverTimestamp()
  });
```

This update is fire-and-forget. Do NOT `await` it -- the profile response should not be delayed by the analytics write. If the increment fails (network blip, Firestore hiccup), the view is silently lost. Acceptable for vanity metrics.

### Caching Impact on Counts

Profile responses are cached for 5 minutes (`Cache-Control: public, max-age=300` per `10_Public_Profiles.md`). This means:

- Multiple visits from the same CDN edge within 5 minutes do NOT hit the Cloud Function
- Counts undercount actual views by some margin
- This is acceptable and actually beneficial -- it provides natural throttling against view inflation

## PDF Download Counting

### When a Download Is Counted

A download increments when `POST /api/pdf/generate` successfully generates and returns a PDF. Failed generations (500 errors) do NOT increment.

### How the Increment Happens

Inside the PDF generation Cloud Function, after successful Puppeteer render and before returning the binary:

```
await admin.firestore()
  .doc(`analytics/${resumeId}`)
  .update({
    pdfDownloads: FieldValue.increment(1)
  });
```

This one IS awaited -- PDF generation already takes several seconds, and the download count should be accurate since it's tied to a paid action.

## Displaying Analytics

### Dashboard Cards (Paid Users)

Each resume card on the dashboard shows:

```
142 views · 8 downloads
```

- `text-xs text-gray-500`
- Format: `{profileViews} views · {pdfDownloads} downloads`
- Singular: "1 view · 1 download"
- Zero state: "0 views · 0 downloads"

### Dashboard Cards (Free Users)

Analytics data exists in Firestore but is not shown:

- Replace the analytics line with: "Upgrade to see analytics" in `text-xs text-gray-400`
- Or simply hide the analytics line entirely

Data continues to accumulate regardless of tier. When a free user upgrades, they see their full accumulated counts immediately.

### Analytics Detail (Future)

No dedicated analytics page at MVP. The dashboard card counters are the only UI surface. A dedicated analytics page with time-series data, referrer tracking, and geography is deferred to `19_Future_Features.md`.

## Security Rules

The `analytics` collection has split read/write permissions:

### Read

Only the document owner can read their analytics:

```
allow read: if request.auth.uid == resource.data.userId;
```

No public read. Visitors to a public profile never see the view count -- only the profile owner does.

### Write (profileViews)

The public profile endpoint increments `profileViews` via the admin SDK (server-side), which bypasses security rules. However, if client-side increment is ever needed (it shouldn't be), the rule would constrain to increment-only:

```
allow update: if request.resource.data.profileViews == resource.data.profileViews + 1
              && request.resource.data.pdfDownloads == resource.data.pdfDownloads;
```

### Write (pdfDownloads)

Only via admin SDK in the PDF generation Cloud Function. No client-side writes.

## Abuse Prevention

### View Count Inflation

Without deduplication, a bot or determined user could inflate view counts by hitting the profile endpoint repeatedly.

**MVP mitigations (passive):**
- CDN caching (5-minute `max-age`) means cached responses don't trigger increments
- Cloud Functions have built-in rate limiting per IP at the infrastructure level
- View counts are vanity metrics with no business logic attached -- inflation has no functional impact

**Post-MVP mitigations (if needed):**
- IP-based deduplication: hash the viewer's IP, check against a short-lived set (Redis or Firestore TTL collection), only increment if not seen in the last hour
- Session-based deduplication: set a cookie or use session storage on the profile page, skip increment if already counted this session
- Rate limiting middleware on the profile endpoint

### PDF Download Inflation

Not a concern. PDF generation is gated behind paid subscription and takes 3-10 seconds per request. Natural throttle.

## Analytics Document Lifecycle

### Creation

Created alongside the resume document. Two places this happens:

1. **Onboarding** (first resume): Cloud Function or client creates `analytics/{resumeId}` with `{ userId, profileViews: 0, pdfDownloads: 0, lastViewedAt: null }`
2. **New variant** (additional resumes): `POST /api/resumes/create` Cloud Function creates the analytics document as part of the same operation

### Deletion

Deleted when the parent resume is deleted. The resume deletion Cloud Function (see `12_Resume_Variants.md`) deletes `analytics/{resumeId}` as part of the cleanup batch.

### No Orphan Cleanup

If a resume is deleted but the analytics delete fails, an orphaned analytics document remains. This is harmless -- it's a small document with no references. No scheduled cleanup for orphaned analytics at MVP.

## API Access

### REST Endpoint

`GET /api/analytics/:resumeId` -- see `03_API_Endpoints.md`.

Returns:
```
{
  "profileViews": 142,
  "pdfDownloads": 8,
  "lastViewedAt": "2026-05-24T14:30:00Z"
}
```

Auth required. User must own the resume. Used by the agent API (see `16_Agent_API.md`) for programmatic analytics access.

### Dashboard Data Loading

The dashboard fetches analytics as a parallel query alongside resumes (see `11_Dashboard.md`). For each resume, fetch `analytics/{resumeId}`. With a maximum of 3 resumes, this means 3 small document reads -- negligible cost and latency.

## Gaps & Assumptions

- **No time-series data**: Counters only show totals, not trends. Users cannot see "views this week vs last week" or a graph of views over time. Adding time-series would require a different data model (daily/weekly rollup documents or a time-series database). Deferred to `19_Future_Features.md`.
- **No referrer tracking**: No information about where profile visitors come from (LinkedIn, email, direct). Would require capturing `document.referrer` or `Referer` header and storing per-view data. Adds significant complexity and privacy considerations. Deferred.
- **No unique visitor count**: `profileViews` counts page loads, not unique visitors. The same person viewing 10 times counts as 10 views. Unique counting requires session or IP tracking, which adds complexity and privacy surface area.
- **Counter accuracy**: Firestore `FieldValue.increment()` is atomic and handles concurrent writes correctly. No risk of lost increments under normal load. Under extreme concurrent load (hundreds of simultaneous views), Firestore may throttle writes to a single document at ~1 write/second. If a profile goes viral, some increments may queue or fail silently. Acceptable for vanity metrics.
- **Analytics for free users accumulating data**: Free users' profiles are public, so views accumulate even though the user can't see the count. This is a feature, not a bug -- when they upgrade, they see accumulated traction, which reinforces the upgrade decision.  
