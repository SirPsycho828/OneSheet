## Overview

Every BragSheet user gets a public profile at `bragsheet.io/{username}` that displays their default resume as a beautifully rendered page. Public profiles show the rendered resume only -- no raw markdown, no editor chrome. Free users' profiles include a subtle "Create yours" link to BragSheet; paid users' profiles are clean. No authentication required to view.

## Dependencies

- `02_Database_Schema.md` -- `usernames` collection for slug resolution, `resumes` collection for content
- `03_API_Endpoints.md` -- `GET /api/profile/:username` and `GET /api/profile/:username/meta`
- `08_Template_System.md` -- Template CSS applied to rendered profile
- `07_One_Page_Constraint.md` -- Scale factor applied to rendered content
- `15_Profile_Analytics.md` -- View counter incremented on each profile load
- `04_UI_Design_System.md` -- Page shell around the resume

## URL Structure

```
bragsheet.io/{username}
```

Examples:
- `bragsheet.io/jane-doe`
- `bragsheet.io/alex`

Username validation rules defined in `01_Auth.md`: 3-30 chars, lowercase alphanumeric + hyphens, unique.

No nested paths. No `/resume` suffix. The username IS the profile URL. This keeps shareable links clean for business cards, email signatures, and LinkedIn bios.

## Resolution Flow

1. Client navigates to `bragsheet.io/{username}`
2. App router matches the `/:username` route (catch-all, lowest priority after static routes like `/sign-in`, `/pricing`, `/editor`)
3. Client calls `GET /api/profile/{username}`
4. Server looks up `usernames/{username}` document to get `uid`
5. Server queries `resumes` where `userId == uid` and `isDefault == true`
6. Server renders markdown to HTML using the resume's template (same remark pipeline as editor and PDF export)
7. Server returns `{ displayName, photoURL, resumeHtml, templateId, paperSize, lastUpdated }`
8. Client renders the response in the profile page shell

### Route Priority

The `/:username` route must NOT conflict with app routes. Ensure static routes are defined first in the router:

```
/sign-in, /sign-up          -> Auth pages
/onboarding                  -> Onboarding
/editor, /editor/:resumeId  -> Editor
/dashboard                   -> Dashboard
/settings                    -> Settings
/privacy, /terms             -> Legal
/:username                   -> Public profile (catch-all)
```

If a username matches a reserved word (e.g., someone tries to claim "settings"), the reserved words list in `01_Auth.md` prevents it during onboarding.

## Profile Page Layout

The public profile is a minimal page designed to showcase the resume:

```
+--------------------------------------------------+
| Nav: BragSheet logo (links to landing page)      |
+--------------------------------------------------+
|                                                  |
|           +----------------------------+         |
|           |                            |         |
|           |   Rendered Resume          |         |
|           |   (paper-sized container)  |         |
|           |                            |         |
|           +----------------------------+         |
|                                                  |
|       [Download PDF]  [Copy Link]                |
|                                                  |
+--------------------------------------------------+
| Footer (optional branding for free tier)         |
+--------------------------------------------------+
```

### Nav Bar

- Minimal: BragSheet logo/wordmark only, links to `bragsheet.io` landing page
- No sign-in buttons in the profile nav -- this is a public-facing page, not an app page
- `h-12`, `bg-white border-b border-gray-200`

### Resume Container

- Centered on the page with `bg-gray-50` behind it
- Paper-sized container matching the resume's `paperSize` (US Letter or A4)
- `bg-white shadow-lg` on the paper
- Template CSS applied via `data-template` attribute
- Scale factor from `resumes.overflow.scaleFactor` applied to content
- Same padding (48px) as editor preview and PDF export

The resume HTML is injected as `dangerouslySetInnerHTML` from the API response. The server has already sanitized the HTML via `rehype-sanitize` in the remark pipeline.

### Action Buttons

Below the resume container, centered:

| Button | Visibility | Behavior |
|--------|-----------|----------|
| "Download PDF" | Only if the profile owner has a paid subscription | Links to PDF download. Requires the viewer to be the profile owner (authenticated). If viewer is not the owner, button is hidden. |
| "Copy Link" | Always | Copies `bragsheet.io/{username}` to clipboard. Toast: "Link copied" |

**Clarification on "Download PDF" for visitors**: Public profile visitors cannot download the PDF. The button only appears when the authenticated profile owner is viewing their own profile (convenient shortcut). There is no public PDF download -- the profile page itself is the shareable artifact.

### Free Tier Branding

Free users' profiles include a footer line:

```
Built with BragSheet -- Create yours
```

- `text-xs text-gray-400`, centered, `py-4`
- "Create yours" is a link to `bragsheet.io` (landing page)
- Minimal and non-intrusive -- does not overlap or visually compete with the resume

Paid users: footer is empty or absent entirely.

Branding status is determined by the profile owner's `subscription.status` in the API response. The `GET /api/profile/:username` endpoint includes a `showBranding: boolean` field.

## SEO and Meta Tags

Each public profile needs proper meta tags for link previews on LinkedIn, Twitter/X, Slack, and iMessage.

### Server-Side Meta Injection

The `GET /api/profile/:username/meta` endpoint returns data for meta tags. The client-side app sets these dynamically, but for proper social sharing, meta tags must be present in the initial HTML.

**Approach**: Use a Cloud Function or Firebase Hosting rewrite to serve profile pages with pre-populated meta tags in the `<head>`:

```html
<title>{displayName} -- Resume | BragSheet</title>
<meta name="description" content="{displayName}'s resume on BragSheet">
<meta property="og:title" content="{displayName} -- Resume">
<meta property="og:description" content="View {displayName}'s one-page resume">
<meta property="og:image" content="{ogImageUrl}">
<meta property="og:url" content="https://bragsheet.io/{username}">
<meta name="twitter:card" content="summary_large_image">
```

### OG Image Generation

For social sharing thumbnails, generate a static OG image (1200x630px) showing a miniature preview of the rendered resume on a clean background.

**MVP approach**: Use a generic BragSheet-branded OG image for all profiles (same image, no per-user customization). Per-user OG images (rendered from their actual resume) are a post-MVP enhancement -- see `19_Future_Features.md`.

### Robots and Indexing

Public profiles should be indexable by search engines:

```html
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://bragsheet.io/{username}">
```

No `noindex` on profiles. The user chose to make their resume public -- search visibility is expected.

## 404 Handling

When a username doesn't exist:

- `GET /api/profile/{username}` returns 404
- Client displays a simple 404 page: "This profile doesn't exist" with a CTA: "Create your own BragSheet"
- Same minimal layout as the profile page (nav + centered content + footer)
- No search or suggestions ("did you mean...") at MVP

## Profile Analytics

Each profile view increments `analytics.profileViews` via `FieldValue.increment(1)` on the `analytics` document matching the resume's ID. This happens server-side in the `GET /api/profile/:username` endpoint.

See `15_Profile_Analytics.md` for counter implementation and abuse considerations.

## Caching

### API Response Caching

The `GET /api/profile/:username` response can be cached at the CDN/hosting layer:

- `Cache-Control: public, max-age=300` (5 minutes)
- Profiles don't change frequently -- a 5-minute cache is acceptable
- When a user saves in the editor, there's no cache invalidation at MVP. Changes appear on the public profile within 5 minutes.

If real-time updates are important later, reduce `max-age` or add cache purging on resume save.

### Meta Endpoint Caching

`GET /api/profile/:username/meta` is called by social media crawlers:

- `Cache-Control: public, max-age=3600` (1 hour)
- Crawlers don't need real-time data
- Reduces Cloud Function invocations from repeated crawler hits

## Firebase Hosting Rewrites

Configure `firebase.json` to route profile URLs to the SPA while allowing the API endpoint to handle data fetching:

```json
{
  "hosting": {
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

The SPA catches `/:username` routes and fetches data from the API. The rewrite ensures direct navigation to `bragsheet.io/jane-doe` loads the SPA, which then resolves the profile.

## Gaps & Assumptions

- **SSR for SEO**: Client-side rendering means social media crawlers and search engines may not see the full resume content. The meta endpoint provides basic tags, but the resume text itself isn't in the initial HTML. For MVP this is acceptable -- the profile's value is as a shareable link for humans, not as a search result. If SEO becomes important, add SSR via Cloud Functions or a prerendering service.
- **Profile deactivation**: No way to make a profile private or take it offline at MVP. Users can delete their resume content (empty markdown renders an empty page) but can't remove the URL. A "profile visibility" toggle is a post-MVP feature.
- **Username changes**: Not supported at MVP (see `02_Database_Schema.md`). The public profile URL is permanent once claimed. Old URLs do not redirect.
- **Rate limiting on profile views**: No rate limiting on `GET /api/profile/:username`. The 5-minute CDN cache provides natural throttling. If a profile goes viral and generates excessive Cloud Function invocations, increase cache duration.
- **Accessibility**: Public profiles should meet WCAG 2.1 AA. The rendered resume HTML uses semantic elements (headings, lists, links) from the remark pipeline. Add `lang="en"` to the profile page HTML. Other languages are not explicitly supported at MVP but work if the user writes in another language.  
