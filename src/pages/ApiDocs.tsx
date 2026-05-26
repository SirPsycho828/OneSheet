import { Link } from "react-router-dom";

const API_BASE = "https://onesheet.cv";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Endpoint({
  method,
  path,
  description,
  auth,
  body,
  response,
}: {
  method: string;
  path: string;
  description: string;
  auth: string;
  body?: string;
  response?: string;
}) {
  const methodColor =
    method === "GET"
      ? "bg-success/10 text-success"
      : method === "POST"
        ? "bg-primary/10 text-primary"
        : method === "PUT"
          ? "bg-warning/10 text-warning"
          : "bg-destructive/10 text-destructive";

  return (
    <div className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${methodColor}`}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      <p className="text-xs text-muted-foreground mb-2">Auth: {auth}</p>
      {body && (
        <div className="mb-2">
          <p className="text-xs font-medium text-muted-foreground mb-1">Request Body</p>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto border border-border font-mono">
            {body}
          </pre>
        </div>
      )}
      {response && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Response</p>
          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto border border-border font-mono">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

export function ApiDocs() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/90 backdrop-blur-sm flex-shrink-0">
        <Link
          to="/"
          className="text-sm font-semibold font-heading tracking-tight text-foreground hover:text-primary transition-colors"
        >
          OneSheet
        </Link>
        <div className="w-px h-5 bg-border" aria-hidden />
        <span className="text-sm font-medium text-muted-foreground">
          API Documentation
        </span>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          OneSheet API
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Programmatic access to manage resumes, templates, and exports.
        </p>

        {/* Authentication */}
        <Section title="Authentication">
          <p className="text-sm text-muted-foreground mb-3">
            All API endpoints require authentication via one of two methods:
          </p>
          <div className="space-y-3">
            <div className="bg-card rounded-md border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                Bearer Token (Firebase ID Token)
              </p>
              <pre className="text-xs font-mono mt-1 text-muted-foreground">
                Authorization: Bearer &lt;firebase-id-token&gt;
              </pre>
            </div>
            <div className="bg-card rounded-md border border-border p-3">
              <p className="text-sm font-medium text-foreground">
                API Key (Pro subscription required)
              </p>
              <pre className="text-xs font-mono mt-1 text-muted-foreground">
                X-Api-Key: os_sk_live_...
              </pre>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Base URL: <code className="font-mono">{API_BASE}</code>
          </p>
        </Section>

        {/* Resumes */}
        <Section title="Resumes">
          <Endpoint
            method="GET"
            path="/api/agent/resumes"
            description="List all resumes for the authenticated user (metadata only)."
            auth="Bearer token or API key"
            response={`{
  "resumes": [
    {
      "resumeId": "abc123",
      "title": "Frontend Engineer",
      "templateId": "classic",
      "paperSize": "us-letter",
      "isDefault": true,
      "createdAt": "2025-01-15T...",
      "updatedAt": "2025-01-20T..."
    }
  ]
}`}
          />
          <Endpoint
            method="GET"
            path="/api/agent/resumes/:resumeId"
            description="Get a single resume including markdown content."
            auth="Bearer token or API key"
            response={`{
  "resumeId": "abc123",
  "title": "Frontend Engineer",
  "markdown": "# Your Name\\n...",
  "templateId": "classic",
  "paperSize": "us-letter",
  "isDefault": true
}`}
          />
          <Endpoint
            method="POST"
            path="/api/agent/resumes"
            description="Create a new resume."
            auth="Bearer token or API key"
            body={`{
  "title": "Backend Engineer",
  "markdown": "# Your Name\\n...",
  "templateId": "classic",
  "paperSize": "us-letter"
}`}
            response={`{ "resumeId": "def456" }`}
          />
          <Endpoint
            method="PUT"
            path="/api/agent/resumes/:resumeId"
            description="Update a resume (partial update)."
            auth="Bearer token or API key"
            body={`{
  "title": "Updated Title",
  "markdown": "# Updated content...",
  "templateId": "modern"
}`}
            response={`{ "success": true }`}
          />
          <Endpoint
            method="DELETE"
            path="/api/agent/resumes/:resumeId"
            description="Delete a resume (cannot delete your only resume)."
            auth="Bearer token or API key"
            response={`{ "success": true }`}
          />
          <Endpoint
            method="POST"
            path="/api/agent/resumes/:resumeId/set-default"
            description="Set a resume as the default for your public profile."
            auth="Bearer token or API key"
            response={`{ "success": true }`}
          />
        </Section>

        {/* PDF Export */}
        <Section title="PDF Export">
          <Endpoint
            method="POST"
            path="/api/agent/resumes/:resumeId/export"
            description="Generate and download a PDF of the resume. Requires Pro subscription."
            auth="Bearer token or API key"
            response="Binary PDF file (application/pdf)"
          />
        </Section>

        {/* Templates */}
        <Section title="Templates">
          <Endpoint
            method="GET"
            path="/api/agent/templates"
            description="List all available template IDs and names."
            auth="Bearer token or API key"
            response={`{
  "templates": [
    { "id": "classic", "name": "Classic" },
    { "id": "modern", "name": "Modern" },
    { "id": "minimal", "name": "Minimal" },
    { "id": "technical", "name": "Technical" },
    { "id": "compact", "name": "Compact" }
  ]
}`}
          />
        </Section>

        {/* API Keys */}
        <Section title="API Keys">
          <Endpoint
            method="POST"
            path="/api/agent/keys/generate"
            description="Generate a new API key (max 3 active keys). Requires Pro subscription."
            auth="Bearer token"
            body={`{ "name": "My Integration" }`}
            response={`{
  "keyId": "key123",
  "key": "os_sk_live_...",
  "prefix": "os_sk_live_x",
  "name": "My Integration",
  "createdAt": "2025-01-15T..."
}`}
          />
          <Endpoint
            method="GET"
            path="/api/agent/keys"
            description="List all API keys (metadata only, no secrets)."
            auth="Bearer token"
            response={`{
  "keys": [
    {
      "keyId": "key123",
      "name": "My Integration",
      "prefix": "os_sk_live_x",
      "createdAt": "2025-01-15T...",
      "lastUsedAt": "2025-01-20T...",
      "isActive": true
    }
  ]
}`}
          />
          <Endpoint
            method="POST"
            path="/api/agent/keys/:keyId/revoke"
            description="Revoke an API key (soft delete)."
            auth="Bearer token"
            response={`{ "success": true }`}
          />
          <Endpoint
            method="DELETE"
            path="/api/agent/keys/:keyId"
            description="Permanently delete an API key."
            auth="Bearer token"
            response={`{ "success": true }`}
          />
        </Section>

        {/* Analytics */}
        <Section title="Analytics">
          <Endpoint
            method="GET"
            path="/api/agent/analytics"
            description="Get analytics for all resumes (views, downloads)."
            auth="Bearer token or API key"
            response={`{
  "analytics": [
    {
      "resumeId": "abc123",
      "profileViews": 42,
      "pdfDownloads": 5,
      "lastViewedAt": "2025-01-20T..."
    }
  ]
}`}
          />
        </Section>

        {/* Public Profile */}
        <Section title="Public Profile">
          <Endpoint
            method="GET"
            path="/api/profile/:username"
            description="Get a user's public profile and default resume. No auth required."
            auth="None (public)"
            response={`{
  "displayName": "Jane Doe",
  "username": "janedoe",
  "resume": {
    "markdown": "# Jane Doe\\n...",
    "templateId": "classic",
    "paperSize": "us-letter"
  }
}`}
          />
        </Section>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <Link
            to="/agents"
            className="text-sm text-primary hover:text-brand-600 font-medium"
          >
            View the Agent Guide &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
