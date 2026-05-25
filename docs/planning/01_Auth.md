## Overview

BragSheet uses Firebase Auth with email/password as the primary method and GitHub + Google OAuth as secondary options. Auth state drives routing: new users go to onboarding (username selection), unverified email users see a verification prompt, and authenticated users land in the editor or dashboard.

## Dependencies

- `02_Database_Schema.md` -- User document structure in `users` collection
- `04_UI_Design_System.md` -- Auth page styling, form components
- `10_Public_Profiles.md` -- Username/slug selected during onboarding

## Auth Providers

| Provider | Priority | Notes |
|----------|----------|-------|
| Email/password | Primary | Standard Firebase createUserWithEmailAndPassword |
| Google OAuth | Secondary | Popup-based. Do NOT set Cross-Origin-Opener-Policy headers -- Firebase Hosting default (`unsafe-none`) is required for Google popup auth |
| GitHub OAuth | Secondary | Popup-based. Requires GitHub OAuth app registration |

Use `getAuth(app)` for initialization -- not `initializeAuth`. Simpler and consistent.

## Auth States

The app recognizes four auth states that drive all routing:

| State | Condition | Route |
|-------|-----------|-------|
| `unauthenticated` | No Firebase user | Landing page, sign-in, sign-up |
| `needs_onboarding` | Firebase user exists, no `users` document or no `username` set | `/onboarding` |
| `unverified` | Email/password user, `emailVerified === false` | `/verify-email` |
| `authenticated` | Firebase user + complete `users` document + verified (if email) | `/editor` or `/dashboard` |

OAuth users (Google, GitHub) skip the `unverified` state -- their email is pre-verified by the provider.

## Route Guards

### PublicRoute (sign-in, sign-up, landing)

Redirects ANY signed-in user to the appropriate page. Must handle all signed-in states, not just `authenticated`:

```
if authenticated -> /dashboard or /editor
if needs_onboarding -> /onboarding
if unverified -> /verify-email
```

A new Google OAuth user lands in `needs_onboarding`. If PublicRoute only checks `authenticated`, the user gets stuck on the sign-in page after successful auth.

### PrivateRoute (editor, dashboard, settings)

Requires `authenticated` state. All other states redirect:

```
if unauthenticated -> /sign-in
if needs_onboarding -> /onboarding
if unverified -> /verify-email
```

### OnboardingRoute

Requires `needs_onboarding` state. Authenticated users redirect to editor/dashboard. Unauthenticated users redirect to sign-in.

## Sign-Up Flow

### Email/Password

1. User enters email + password on sign-up page
2. `createUserWithEmailAndPassword` creates Firebase Auth user
3. Send verification email via Firebase `sendEmailVerification`
4. Create `users` document in Firestore with `onboardingComplete: false`
5. Redirect to `/onboarding` (username selection)
6. After onboarding, redirect to `/verify-email` if not yet verified
7. User clicks email link, returns to app, state becomes `authenticated`

### OAuth (Google / GitHub)

1. User clicks "Continue with Google" or "Continue with GitHub"
2. `signInWithPopup` completes auth
3. On first sign-in: no `users` document exists, state is `needs_onboarding`
4. Redirect to `/onboarding` (username selection)
5. After onboarding, state becomes `authenticated` (no verification needed)
6. On subsequent sign-ins: `users` document exists, go straight to editor/dashboard

## Sign-In Flow

1. User enters credentials or clicks OAuth button
2. Firebase Auth resolves
3. App checks for `users` document in Firestore
4. Route based on auth state (see Auth States table above)

## Onboarding

Onboarding is a single screen: username selection.

**Username rules:**
- 3-30 characters
- Lowercase alphanumeric and hyphens only
- Must start and end with alphanumeric character
- Must be unique (check against `usernames` collection -- see `02_Database_Schema.md`)
- Cannot be a reserved word (api, admin, settings, www, app, help, support, about, pricing, blog)

**Onboarding writes:**
1. Claim username in `usernames` collection (set document with ID = username, value = uid)
2. Update `users` document: set `username`, `onboardingComplete: true`, `displayName` (from OAuth profile or email local part)
3. Create initial empty resume document in `resumes` collection (see `02_Database_Schema.md`)

Username claim and user update should be a batched write to prevent orphaned username claims.

## Email Verification

Applies only to email/password users. OAuth users are auto-verified.

- Show a simple page: "Check your email for a verification link"
- Include a "Resend verification email" button
- Rate limit resend: disable button for 60 seconds after sending
- On return from email link, Firebase Auth automatically updates `emailVerified`
- App detects the change via `onAuthStateChanged` and transitions to `authenticated`

## Session Management

- Use Firebase Auth's built-in session persistence (`browserLocalPersistence`)
- `onAuthStateChanged` listener at app root drives auth state
- No custom token management needed at MVP
- Auth state check on every app load determines initial route

## Account Linking

When a user signs up with email/password and later tries to sign in with Google using the same email (or vice versa):

- Firebase's default behavior throws `auth/account-exists-with-different-credential`
- Handle this by prompting the user: "An account with this email already exists. Sign in with [original method] to link your accounts."
- Do NOT auto-link accounts silently -- let the user confirm

## Password Reset

Standard Firebase `sendPasswordResetEmail` flow. Link on sign-in page. No custom UI beyond the trigger button -- Firebase handles the reset page.

## Sign Out

- Call `signOut` from Firebase Auth
- Clear any local state / cached resume data
- Redirect to landing page

## Security Rules Context

Auth integrates with Firestore security rules (defined in `02_Database_Schema.md`):

- Users can only read/write their own `users` document (`request.auth.uid == resource.data.uid`)
- Resume documents are owned by `userId` field (`request.auth.uid == resource.data.userId`)
- Public profile reads are unauthenticated (no auth required for `GET /u/{username}`)
- Username uniqueness enforced by security rules on the `usernames` collection (create-only, no updates, delete only by owner)

## Rate Limiting

No custom rate limiting at MVP. Firebase Auth has built-in rate limits:

- Email/password sign-in: Firebase limits after repeated failures
- Email sending: Firebase limits verification/reset emails
- OAuth: Provider-side rate limiting applies

If abuse becomes an issue post-launch, add Cloud Functions rate limiting on the agent API (see `16_Agent_API.md`).

## Roles and Permissions

MVP has a single role: **user**. No admin panel, no team features, no role hierarchy.

| Role | Permissions |
|------|------------|
| `user` | CRUD own resumes, manage own profile, export own PDFs, view own analytics |
| `anonymous` | View public profiles (read-only, no auth required) |

Admin operations (user management, abuse moderation) are handled directly through Firebase Console at MVP. Admin role deferred to `19_Future_Features.md`.

## Paid Tier Auth Considerations

Subscription status (free vs paid) is stored in the `users` document, not in Firebase Auth custom claims at MVP. The Stripe webhook updates the `users` document (see `14_Stripe_Billing.md`). Feature gating checks `users.subscription.status` on the client and validates in security rules / Cloud Functions.

If performance becomes an issue (too many Firestore reads to check subscription), migrate to Firebase Auth custom claims in a later phase.

## Gaps & Assumptions

- **Account deletion**: GDPR requires account deletion capability. At MVP, handle manually via Firebase Console. Self-service account deletion is a post-MVP feature (see `19_Future_Features.md`).
- **OAuth scope**: Google OAuth requests `email` and `profile` scopes only. GitHub OAuth requests `user:email` scope only. No additional permissions needed.
- **Display name source**: OAuth users get display name from provider profile. Email users get email local part (before @) as default, editable in settings later.
- **Multiple OAuth providers**: A user cannot link multiple OAuth providers at MVP. Single provider per account. Account linking (Google + GitHub on same account) deferred.
- **Session duration**: Firebase Auth default (indefinite until explicit sign-out or token revocation). No custom session timeout at MVP.  
