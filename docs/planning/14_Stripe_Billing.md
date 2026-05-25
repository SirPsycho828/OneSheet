## Overview

BragSheet uses Stripe for freemium SaaS billing. One paid plan ("Pro") at $8/month unlocks PDF export, all templates, up to 3 resume variants, version history access, profile analytics, and branding removal. Stripe Checkout handles payment collection. Stripe Customer Portal handles subscription management. Webhooks sync subscription state to Firestore.

## Dependencies

- `02_Database_Schema.md` -- `users.subscription` map, `customers` collection
- `03_API_Endpoints.md` -- Checkout, portal, and webhook endpoints
- `01_Auth.md` -- User must be authenticated before checkout
- `09_PDF_Export.md` -- PDF gate checks subscription status
- `12_Resume_Variants.md` -- Variant limit depends on tier
- `08_Template_System.md` -- Template access depends on tier

## Stripe Configuration

### Products and Prices

Create in Stripe Dashboard (not via API):

| Product | Price ID | Amount | Interval | Notes |
|---------|----------|--------|----------|-------|
| BragSheet Pro | `price_xxx` | $8.00 | Monthly | Single price. No annual option at MVP |

Store the Price ID as an environment variable (`STRIPE_PRO_PRICE_ID`) in Cloud Functions config. Do not hardcode.

### Stripe Keys

| Key | Storage | Used By |
|-----|---------|---------|
| Publishable key (`pk_live_xxx`) | Client-side env var | Stripe.js initialization |
| Secret key (`sk_live_xxx`) | Cloud Functions config | Server-side Stripe SDK |
| Webhook signing secret (`whsec_xxx`) | Cloud Functions config | Webhook signature verification |

## Feature Gating

### What Each Tier Gets

| Feature | Free | Pro |
|---------|------|-----|
| Markdown editor | Yes | Yes |
| Live preview | Yes | Yes |
| Public profile | Yes (with branding) | Yes (no branding) |
| Templates | `classic` only | All 5 |
| PDF export | No | Yes |
| Resume variants | 1 | Up to 3 |
| Version history | No | Yes |
| Profile analytics | No | Yes |

### How Gating Works

Client-side checks read `users.subscription.status` from the user's Firestore document:

```
isPaid = subscription.status === "active"
```

Server-side checks (Cloud Functions) read the same field. Both must agree. The client check provides UI responsiveness; the server check is authoritative.

Features gated client-side:
- Template picker shows lock icons on non-classic templates
- "Export PDF" button shows "Upgrade to export"
- "+ New Resume" hidden when at free limit (1)
- Version history menu item hidden or shows upgrade prompt
- Analytics section hidden on dashboard cards

Features gated server-side:
- `POST /api/pdf/generate` returns 403 if not paid
- `POST /api/resumes/create` enforces variant limit based on tier
- Version list endpoint returns 403 if not paid

## Checkout Flow

### Initiating Checkout

1. User clicks any upgrade CTA (export button, template lock, variant limit message)
2. Client calls `POST /api/stripe/create-checkout-session` with `{ priceId, successUrl, cancelUrl }`
3. Server creates a Stripe Checkout Session:
   - `mode: "subscription"`
   - `customer_email`: user's email (pre-fills Stripe form)
   - `client_reference_id`: user's Firebase UID (links Stripe customer to Firebase user)
   - `metadata: { firebaseUid: uid }` (backup reference)
   - `success_url`: `https://bragsheet.io/settings?checkout=success`
   - `cancel_url`: `https://bragsheet.io/settings?checkout=canceled`
4. Server returns `{ sessionId }`
5. Client redirects to Stripe Checkout using `stripe.redirectToCheckout({ sessionId })`
6. User completes payment on Stripe's hosted page
7. Stripe redirects to `success_url`

### Post-Checkout Success Page

When the user lands on `/settings?checkout=success`:
- Show a success banner: "Welcome to Pro! All features are now unlocked."
- The webhook may not have fired yet. Poll `users.subscription.status` for up to 10 seconds (check every 2 seconds). Once it flips to `"active"`, refresh the UI. If it doesn't update within 10 seconds, show: "Your upgrade is processing. Features will unlock shortly."

### Post-Checkout Cancel

When the user lands on `/settings?checkout=canceled`:
- No action needed. User simply returns to the app on the free tier.

## Webhook Handling

### Endpoint

`POST /api/stripe/webhook` -- see `03_API_Endpoints.md`.

### Signature Verification

Every incoming webhook request must be verified:

```
const event = stripe.webhooks.constructEvent(
  requestBody,
  request.headers['stripe-signature'],
  WEBHOOK_SIGNING_SECRET
);
```

Reject unverified requests with 400.

### Handled Events

#### `checkout.session.completed`

First-time subscription creation:

1. Extract `client_reference_id` (Firebase UID) and Stripe customer/subscription IDs
2. Create `customers/{uid}` document with Stripe IDs and `status: "active"`
3. Update `users/{uid}.subscription`: `{ status: "active", stripeCustomerId, stripePriceId, currentPeriodEnd }`

#### `customer.subscription.updated`

Subscription changes (renewal, plan change, payment method update):

1. Look up Firebase UID from `customers` collection using `stripeCustomerId`
2. Update `customers/{uid}`: sync `status`, `currentPeriodEnd`, `cancelAtPeriodEnd`
3. Update `users/{uid}.subscription`: sync matching fields

#### `customer.subscription.deleted`

Subscription canceled and period ended:

1. Look up Firebase UID from `customers` collection
2. Update `customers/{uid}`: set `status: "canceled"`, clear subscription fields
3. Update `users/{uid}.subscription`: set `status: "free"`, clear Stripe fields

#### `invoice.payment_failed`

Payment failed (card expired, insufficient funds):

1. Look up Firebase UID
2. Update `customers/{uid}`: set `status: "past_due"`
3. Update `users/{uid}.subscription`: set `status: "past_due"`

Stripe automatically retries failed payments and emails the customer. No additional retry logic needed from BragSheet.

### Idempotency

Stripe may send duplicate webhook events. Guard against double-processing:

1. On each webhook, check if `event.id` exists in a `stripeEvents` collection
2. If it exists, return 200 immediately (already processed)
3. If not, write `{ eventId, processedAt }` to `stripeEvents/{eventId}` and process
4. Set a TTL on `stripeEvents` documents: auto-delete after 30 days (use Firestore TTL policy)

## Subscription Management

### Customer Portal

Users manage their subscription (cancel, update payment method, view invoices) through Stripe's hosted Customer Portal.

Access point: "Manage subscription" button on the settings page.

1. Client calls `POST /api/stripe/create-portal-session`
2. Server creates a Stripe Billing Portal session with `return_url: "https://bragsheet.io/settings"`
3. Server returns `{ url }`
4. Client redirects to the portal URL
5. User manages subscription on Stripe's hosted page
6. On return, user lands back on `/settings`

Configure the Customer Portal in Stripe Dashboard:
- Allow cancellation (cancel at period end, not immediately)
- Allow payment method updates
- Show invoice history
- Do NOT allow plan changes (single plan at MVP)

### Cancellation Behavior

When a user cancels via the Customer Portal:

1. Stripe sets `cancel_at_period_end: true` on the subscription
2. Webhook `customer.subscription.updated` fires with `cancelAtPeriodEnd: true`
3. User retains Pro access until `currentPeriodEnd`
4. At period end, Stripe fires `customer.subscription.deleted`
5. Webhook sets status to `"free"` on both `customers` and `users.subscription`
6. Pro features become gated again

### UI During Cancellation Period

When `subscription.status === "active"` AND `cancelAtPeriodEnd === true`:
- Show in settings: "Your Pro plan is active until {date}. After that, you'll switch to the free plan."
- "Resubscribe" button: links to the Customer Portal where Stripe allows reactivation
- All Pro features remain accessible until the period ends

## Downgrade Behavior

When a user loses Pro status (subscription ends or payment fails):

| Feature | Downgrade Behavior |
|---------|-------------------|
| Templates | Resumes keep their current template but user can't switch to locked ones. Preview and public profile continue rendering with the assigned template |
| Resume variants | All variants remain accessible. User can edit all existing resumes but cannot create new ones beyond the free limit (1) |
| PDF export | Blocked. "Upgrade to export" button returns |
| Version history | Hidden. Existing versions are retained in Firestore but UI access is gated |
| Analytics | Hidden. Data continues to accumulate but dashboard doesn't show it |
| Public profile branding | "Create yours" footer reappears |

No data is deleted on downgrade. If the user resubscribes, everything is restored immediately.

## Gaps & Assumptions

- **Price point**: $8/month is the PRD's lower bound ($8-12 range). Adjustable in Stripe Dashboard without code changes. The app reads the price from Stripe Checkout, not from a hardcoded value. Landing page pricing display should reference a constant (see `05_Landing_Page.md`).
- **Tax handling**: Stripe Tax is not enabled at MVP. If the user base spans multiple tax jurisdictions, enable Stripe Tax or Stripe's automatic tax calculation later.
- **Free trial**: No free trial at MVP. Users start on free tier and upgrade when they want to. A 7-day Pro trial could be added later via Stripe's `trial_period_days` parameter on the checkout session.
- **Multiple plans**: Single plan at MVP. If a "Team" or "Enterprise" tier is added later, the `stripePriceId` field on the user document already supports multiple price IDs. The feature gating logic would check the price ID to determine the tier.
- **Refunds**: Handled manually through Stripe Dashboard. No in-app refund flow. Refunded subscriptions trigger `customer.subscription.updated` with appropriate status changes.
- **Currency**: USD only at MVP. Stripe supports multi-currency, but a single currency keeps pricing and display simple. International pricing deferred.
- **Webhook endpoint security**: The webhook endpoint is public (no Firebase Auth). Security relies entirely on Stripe signature verification. Ensure the endpoint rejects any request with an invalid or missing signature.  
