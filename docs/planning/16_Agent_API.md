▸ Extended thinking (449 chars)  
## Overview

BragSheet supports AI agents as first-class users. The agent API provides the same capabilities as the human UI through a REST interface authenticated with API keys. An agent can create resumes, update content, switch templates, export PDFs, and read analytics -- all without human interaction. This is the same system with a different auth mechanism, not a separate product.

## Dependencies

- `03_API_Endpoints.md` -- All endpoints accessible via API key auth
- `02_Database_Schema.md` -- `apiKeys` collection (new), `resumes` and `analytics` collections
- `01_Auth.md` -- API keys map to user accounts
- `09_PDF_Export.md` -- PDF export available via API
- `14_Stripe_Billing.md` -- API access requires paid tier
- `12_Resume_Variants.md` -- Variant limits apply equally to agent actions

## API Key System

### Key Generation

Users generate API keys from a settings page in the app. No automatic key creation.

1. User navigates to Settings > API Keys
2. Clicks "Generate API Key"
3. Server creates a key, returns it once: `brag_sk_live_{32 random hex chars}`
4. User copies the key. It is never shown again after this screen.
5. The key is stored hashed (SHA-256) in Firestore -- plaintext is never persisted

### Key Storage

New Firestore collection: `apiKeys`

| Field | Type | Notes |
|-------|------|-------|
| _(document ID)_ | | Auto-generated |
| `keyHash` | `string` | SHA-256 hash of the full API key |
| `keyPrefix` | `string` | First 8 chars of the key (e.g., `brag_sk_`) for display/identification |
| `userId` | `string` | Firebase UID of the key owner |
| `name` | `string` | User-provided label (e.g., "Claude agent", "CI pipeline") |
| `createdAt` | `Timestamp` | |
| `lastUsedAt` | `Timestamp \| null` | Updated on each API call |
| `isActive` | `boolean` | Can be revoked without deletion |

### Key Limits

| Constraint | Value |
|------------|-------|
| Max keys per user | 3 |
| Key length | 40 characters total (`brag_sk_live_` prefix + 32 hex) |
| Tier requirement | Paid only. Free users see "Upgrade to Pro to use the API" |

### Key Revocation

From Settings > API Keys, users see a list of their keys (showing `keyPrefix` and `name`):

- "Revoke" button sets `isActive: false`
- "Delete" button removes the document entirely
- Revoked keys return 401 on any API call

## Authentication

### Request Format

API key is sent in a custom header:

```
X-API-Key: brag_sk_live_abc123...
```

### Verification Flow

On every API request with an `X-API-Key` header:

1. Hash the provided key with SHA-256
2. Query `apiKeys` collection where `keyHash == hash` and `isActive == true`
3. If no match, return 401 `{ "error": { "code": "INVALID_API_KEY", "message": "Invalid or revoked API key" } }`
4. If match, extract `userId` from the document
5. Load the user's `users` document to check subscription status
6. If not paid, return 403 `{ "error": { "code": "SUBSCRIPTION_REQUIRED", "message": "Active Pro subscription required for API access" } }`
7. Update `lastUsedAt` on the API key document (fire-and-forget, don't block the request)
8. Proceed with the request using `userId` as the authenticated identity

### Auth Priority

Endpoints accept EITHER `Authorization: Bearer {token}` (Firebase Auth) OR `X-API-Key: {key}`. If both are present, `Authorization` takes precedence. The request handler checks:

```
if (Authorization header) -> Firebase Auth flow
else if (X-API-Key header) -> API key flow
else -> 401
```

## Agent Endpoints

All existing endpoints from `03_API_Endpoints.md` work with API key auth. Additionally, these CRUD endpoints exist specifically for agent workflows:

### Resume Management

#### `GET /api/agent/resumes`

List all resumes for the API key owner.

Response:
```json
{
  "resumes": [
    {
      "id": "abc123",
      "title": "Frontend Resume",
      "templateId": "modern",
      "isDefault": true,
      "paperSize": "us-letter",
      "overflow": { "isOverflowing": false, "scaleFactor": 1.0 },
      "createdAt": "2026-05-20T...",
      "updatedAt": "2026-05-25T..."
    }
  ]
}
```

#### `GET /api/agent/resumes/:resumeId`

Get a single resume including its full markdown content.

Response includes all fields from the list endpoint plus `markdown: string`.

#### `POST /api/agent/resumes`

Create a new resume variant.

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `title` | `string` | Yes | -- |
| `markdown` | `string` | No | `""` |
| `templateId` | `string` | No | `"classic"` |
| `paperSize` | `string` | No | User's default |

Subject to variant limits (see `12_Resume_Variants.md`). Returns the created document.

#### `PUT /api/agent/resumes/:resumeId`

Update an existing resume.

| Field | Type | Required |
|-------|------|----------|
| `title` | `string` | No |
| `markdown` | `string` | No |
| `templateId` | `string` | No |

Partial updates: only provided fields are changed. Updating `markdown` triggers a version snapshot (same logic as manual save in `13_Version_History.md`).

#### `DELETE /api/agent/resumes/:resumeId`

Delete a resume. Same rules as human deletion: cannot delete the last resume, deleting the default promotes another. See `12_Resume_Variants.md`.

### Default Management

#### `POST /api/agent/resumes/:resumeId/set-default`

Set a resume as the default for the public profile. Same batched write behavior as `12_Resume_Variants.md`.

### PDF Export

#### `POST /api/agent/resumes/:resumeId/export`

Triggers PDF generation and returns the PDF binary. Same as `POST /api/pdf/generate` but scoped under the agent path for clarity. Accepts optional `paperSize` override.

Response: PDF binary with `Content-Type: application/pdf`.

### Analytics

#### `GET /api/agent/analytics`

Returns analytics for all of the user's resumes in a single call (convenience endpoint agents prefer over per-resume lookups).

Response:
```json
{
  "analytics": [
    {
      "resumeId": "abc123",
      "resumeTitle": "Frontend Resume",
      "profileViews": 142,
      "pdfDownloads": 8,
      "lastViewedAt": "2026-05-24T..."
    }
  ]
}
```

### Templates

#### `GET /api/agent/templates`

List available templates with their IDs and names. Agents need this to know valid `templateId` values.

Response:
```json
{
  "templates": [
    { "id": "classic", "name": "Classic" },
    { "id": "modern", "name": "Modern" },
    { "id": "minimal", "name": "Minimal" },
    { "id": "technical", "name": "Technical" },
    { "id": "compact", "name": "Compact" }
  ]
}
```

## Rate Limiting

API key requests are rate-limited to prevent abuse:

| Limit | Value |
|-------|-------|
| Requests per minute | 30 |
| PDF exports per hour | 10 |
| Resume creates per hour | 5 |

Rate limiting is per API key, not per user (a user with 3 keys gets 3x the limits).

### Implementation

Use a simple Firestore-based counter:

1. Document: `rateLimits/{keyHash}_{window}` (e.g., `abc123_2026-05-25T14:30`)
2. On each request, increment counter. If over limit, return 429.
3. TTL: auto-delete after 1 hour

Response on rate limit:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again in 42 seconds.",
    "retryAfter": 42
  }
}
```

Include `Retry-After` header with seconds until the window resets.

## Error Response Format

All agent API errors follow the standard format from `03_API_Endpoints.md`:

```json
{
  "error": {
    "code": "UPPER_SNAKE_CASE",
    "message": "Human-readable description"
  }
}
```

Agent-specific error codes:

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_API_KEY` | 401 | Key not found or revoked |
| `SUBSCRIPTION_REQUIRED` | 403 | No active Pro subscription |
| `RATE_LIMITED` | 429 | Too many requests |
| `VARIANT_LIMIT_REACHED` | 403 | Cannot create more resumes |
| `CANNOT_DELETE_LAST` | 400 | Cannot delete only remaining resume |
| `INVALID_TEMPLATE` | 400 | `templateId` not in valid template list |

## Settings UI for API Keys

Located in Settings page (not a separate page):

### Key List

Table showing existing keys:

| Column | Content |
|--------|---------|
| Name | User-provided label |
| Key | `brag_sk_live_****...****` (prefix + masked) |
| Created | Relative timestamp |
| Last used | Relative timestamp or "Never" |
| Actions | "Revoke" / "Delete" buttons |

### Generate Key Dialog

Modal with:
- Name input (required): placeholder "e.g., Claude agent"
- "Generate" button
- On generation: show the full key in a monospaced readonly input with a "Copy" button
- Warning: "This key will only be shown once. Copy it now."
- "Done" button closes the modal

## Gaps & Assumptions

- **No OAuth for agents**: Agents authenticate via API keys, not OAuth tokens. This is simpler for agent workflows (no token refresh, no browser-based auth flow). The trade-off is that API keys don't expire automatically -- users must revoke them manually.
- **No scoped permissions**: API keys have full access to the user's account (same as the user in the UI). There are no read-only keys or keys scoped to a specific resume. Fine-grained permissions deferred.
- **No webhook notifications**: Agents cannot register webhooks to be notified of profile views or other events. Polling the analytics endpoint is the only option. Agent-facing webhooks are a post-MVP feature.
- **No API documentation page**: At MVP, the API is documented in this file only. A public API docs page (like Stripe's docs) is a post-MVP effort. Agents using BragSheet will be configured by their human operators who read this spec.
- **X402/MPP protocols**: Deferred to Phase 3 per step 6 decisions. The agent API uses standard API key auth, not payment protocol headers. When X402 matures, it could replace or supplement the API key system for agent-to-agent transactions.
- **Agent identification**: No `User-Agent` requirement for agent requests. Agents may self-identify but are not required to. If agent traffic analysis becomes important, add optional `X-Agent-Name` header tracking.  
