## Overview

Cloud Functions REST endpoints for BragSheet. Most CRUD operations happen client-side via Firestore SDK with security rules. The API exists for operations that require server-side logic: PDF rendering, Stripe webhooks, public profile resolution, analytics increments, and the agent API. All endpoints are deployed as Firebase Cloud Functions (Node.js) behind the `/api` path prefix.

## Dependencies

- `02_Database_Schema.md` -- All collection schemas referenced by endpoints
- `01_Auth.md` -- Firebase Auth token verification for protected endpoints
- `09_PDF_Export.md` -- PDF generation logic and paid gate
- `14_Stripe_Billing.md` -- Stripe webhook handling
- `16_Agent_API.md` -- Agent-specific endpoint behavior and auth

## Base Configuration

- **Base URL**: `https://us-central1-<project-id>.cloudfunctions.net/api`
- **Auth**: Firebase Auth ID token in `Authorization: Bearer <token>` header for protected endpoints
- **Agent auth**: API key in `X-API-Key` header (see `16_Agent_API.md`)
- **Content-Type**: `application/json` for all request/response bodies
- **CORS**: Allow `bragsheet.io` and `localhost:5173` (dev)

## Endpoints

### PDF Generation

#### `POST /api/pdf/generate`

**Auth**: Required (Bearer token). User must have `subscription.status === "active"`.

**Purpose**: Renders a resume as a one-page PDF using server-side Puppeteer.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `resumeId` | `string` | Yes | Must belong to authenticated user |
| `paperSize` | `string` | No | `"us-letter"` or `"a4"`. Defaults to resume's `paperSize` field |

**Process**:
1. Verify user owns the resume
2. Check paid subscription status -- return 403 if free tier
3. Fetch resume document and resolve template
4. Render markdown to HTML using template styles
5. Apply one-page constraint scaling (use `overflow.scaleFactor` from document)
6. Generate PDF via Puppeteer with exact paper dimensions
7. Increment `analytics.pdfDownloads` via admin SDK
8. Return PDF as binary stream

**Response**: `200` with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="{username}-resume.pdf"`

**Errors**:
- `403` -- Free tier user or resume not owned by user
- `404` -- Resume not found
- `500` -- Puppeteer rendering failure (retry-safe)

**Cloud Function config**: 1GB memory minimum, 60s timeout. Puppeteer requires `--no-sandbox` flag in Cloud Functions environment.

---

### Public Profiles

#### `GET /api/profile/:username`

**Auth**: None (public endpoint).

**Purpose**: Resolves a username to rendered resume data for the public profile page.

**Process**:
1. Look up `usernames/{username}` to get `uid`
2. Query `resumes` where `userId == uid` and `isDefault == true`
3. Increment `analytics.profileViews` for the resume
4. Return rendered resume data (not raw markdown)

**Response**:
```
{
  "displayName": "Jane Doe",
  "photoURL": "...",
  "resumeHtml": "<rendered HTML>",
  "templateId": "classic",
  "paperSize": "us-letter",
  "lastUpdated": "2026-05-20T..."
}
```

Returns pre-rendered HTML, not raw markdown. The public profile page displays the rendered result. See `10_Public_Profiles.md`.

**Errors**:
- `404` -- Username not found or no default resume set

#### `GET /api/profile/:username/meta`

**Auth**: None (public endpoint).

**Purpose**: Returns OpenGraph/meta data for link previews and SEO without the full resume HTML.

**Response**:
```
{
  "displayName": "Jane Doe",
  "title": "My Resume",
  "photoURL": "...",
  "username": "jane-doe"
}
```

---

### Stripe Webhooks

#### `POST /api/stripe/webhook`

**Auth**: Stripe signature verification via `stripe.webhooks.constructEvent()`. No Bearer token.

**Purpose**: Handles Stripe subscription lifecycle events.

**Handled events**:
- `checkout.session.completed` -- Create `customers` doc, update `users.subscription`
- `customer.subscription.updated` -- Sync status changes (active, past_due, canceled)
- `customer.subscription.deleted` -- Set status to `"canceled"`, clear subscription fields
- `invoice.payment_failed` -- Set status to `"past_due"`

All writes go to `customers` collection first, then sync relevant fields to `users.subscription`. See `14_Stripe_Billing.md` for detailed webhook handling.

**Response**: `200` with `{ "received": true }` for all handled events. `200` for unhandled events (Stripe expects 2xx).

---

### Stripe Checkout

#### `POST /api/stripe/create-checkout-session`

**Auth**: Required (Bearer token).

**Body**:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `priceId` | `string` | Yes | Stripe Price ID for the plan |
| `successUrl` | `string` | Yes | Redirect URL after successful payment |
| `cancelUrl` | `string` | Yes | Redirect URL if user cancels |

**Response**: `200` with `{ "sessionId": "cs_..." }` for client-side redirect to Stripe Checkout.

#### `POST /api/stripe/create-portal-session`

**Auth**: Required (Bearer token).

**Purpose**: Creates a Stripe Customer Portal session for subscription management (cancel, update payment method).

**Response**: `200` with `{ "url": "https://billing.stripe.com/..." }` for redirect.

---

### Username Availability

#### `GET /api/username/check/:username`

**Auth**: Required (Bearer token). Only during onboarding.

**Purpose**: Checks if a username is available. Client-side `getDoc` on the `usernames` collection also works, but this endpoint adds reserved word validation.

**Response**:
- `200` with `{ "available": true }` or `{ "available": false, "reason": "taken" | "reserved" | "invalid" }`

Reserved words list defined in `01_Auth.md`.

---

### Analytics

#### `GET /api/analytics/:resumeId`

**Auth**: Required (Bearer token). User must own the resume.

**Purpose**: Returns analytics for a resume. Thin wrapper over the `analytics` collection -- exists mainly for the agent API to have a consistent REST interface.

**Response**:
```
{
  "profileViews": 142,
  "pdfDownloads": 8,
  "lastViewedAt": "2026-05-24T..."
}
```

---

### Version History

#### `GET /api/resumes/:resumeId/versions`

**Auth**: Required (Bearer token). User must own the resume.

**Query params**: `limit` (default 20, max 50), `startAfter` (cursor for pagination).

**Response**: Array of version snapshots ordered by `createdAt` DESC. Returns `markdown`, `templateId`, `createdAt` per version. See `13_Version_History.md`.

#### `POST /api/resumes/:resumeId/versions/restore`

**Auth**: Required (Bearer token). User must own the resume.

**Body**: `{ "versionId": "..." }`

**Process**: Copies the version's `markdown` and `templateId` back to the parent resume document. Creates a new version snapshot of the current state before overwriting (so restore is reversible).

---

### Agent API

All endpoints above are accessible via API key auth (`X-API-Key` header) in addition to Bearer token auth. The agent API does not have separate endpoints -- it's the same system with a different auth mechanism.

Additional agent-only endpoints:

#### `POST /api/agent/resumes`

**Auth**: API key.

**Purpose**: Create a new resume. Body includes `title`, `markdown`, `templateId`.

#### `PUT /api/agent/resumes/:resumeId`

**Auth**: API key.

**Purpose**: Update resume content. Body includes `markdown` and optionally `templateId`, `title`.

#### `GET /api/agent/resumes`

**Auth**: API key.

**Purpose**: List all resumes for the API key owner.

See `16_Agent_API.md` for API key issuance, rate limiting, and agent-specific behavior.

## Error Response Format

All errors follow a consistent shape:

```
{
  "error": {
    "code": "RESUME_NOT_FOUND",
    "message": "No resume found with the given ID"
  }
}
```

Error codes are UPPER_SNAKE_CASE. HTTP status codes follow standard conventions (400 bad request, 401 unauthorized, 403 forbidden, 404 not found, 429 rate limited, 500 internal error).

## Gaps & Assumptions

- **Rate limiting**: No rate limiting at MVP except Stripe's built-in limits. If public profile endpoint gets abused (view count inflation), add IP-based rate limiting via Cloud Functions middleware. See `15_Profile_Analytics.md`.
- **PDF caching**: No caching of generated PDFs at MVP. Each export request re-renders. If PDF generation becomes a cost/performance issue, cache PDFs in Firebase Storage keyed by `{resumeId}-{updatedAt hash}` and invalidate on content change.
- **Resume HTML rendering**: The `/api/profile/:username` endpoint returns pre-rendered HTML. The rendering pipeline (markdown -> remark AST -> HTML + template styles) runs server-side. Same pipeline used for PDF generation. Share the rendering logic between both endpoints.
- **Webhook idempotency**: Stripe can send duplicate webhook events. Use Stripe's event ID as an idempotency key -- check if already processed before writing. Store processed event IDs in a `stripeEvents` collection with TTL (auto-delete after 30 days).
- **Function cold starts**: Puppeteer functions have significant cold start times (5-10s). Consider using Cloud Functions min instances (set to 1) for the PDF endpoint if budget allows, or accept the latency for MVP.
- **API versioning**: No versioning at MVP. All endpoints are unversioned (`/api/...`). If breaking changes are needed later, add `/api/v2/...` prefix.  
