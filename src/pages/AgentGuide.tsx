import { Link } from "react-router-dom";

const API_BASE = "https://us-central1-bragsheet-mvp.cloudfunctions.net/api";

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 mb-8 last:mb-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary text-primary flex items-center justify-center text-xs font-bold">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto border border-border font-mono text-foreground mb-3">
      {children}
    </pre>
  );
}

export function AgentGuide() {
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
        <span className="text-sm font-medium text-muted-foreground">Agent Guide</span>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Agent Integration Guide
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Connect AI agents, CI/CD pipelines, and custom integrations to
          OneSheet via the REST API.
        </p>

        {/* Overview */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Overview
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            The OneSheet API lets you programmatically manage resumes, generate
            PDFs, and keep your public profile up to date. Common use cases:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside mb-3">
            <li>
              AI agents that tailor your resume for each job application
            </li>
            <li>CI/CD pipelines that rebuild and export PDFs on every push</li>
            <li>
              Custom dashboards that aggregate analytics across resumes
            </li>
            <li>
              Slack/Discord bots that let you update your resume from chat
            </li>
          </ul>
        </section>

        {/* Quick Start */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Quick Start
          </h2>

          <Step number={1} title="Get an API Key">
            <p className="text-sm text-muted-foreground mb-2">
              Go to{" "}
              <Link
                to="/settings"
                className="text-primary hover:text-brand-600 font-medium"
              >
                Settings
              </Link>{" "}
              and generate an API key under the "API Access" section. You need a
              Pro subscription to create API keys.
            </p>
            <p className="text-xs text-muted-foreground">
              Your key looks like:{" "}
              <code className="font-mono">brag_sk_live_...</code>
            </p>
          </Step>

          <Step number={2} title="List Your Resumes">
            <CodeBlock>
              {`curl ${API_BASE}/api/agent/resumes \\
  -H "X-Api-Key: brag_sk_live_YOUR_KEY"`}
            </CodeBlock>
            <p className="text-sm text-muted-foreground">
              Returns an array of resume metadata (IDs, titles, template info).
            </p>
          </Step>

          <Step number={3} title="Update a Resume">
            <CodeBlock>
              {`curl -X PUT ${API_BASE}/api/agent/resumes/RESUME_ID \\
  -H "X-Api-Key: brag_sk_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"markdown": "# Your Name\\n\\n## Experience\\n..."}'`}
            </CodeBlock>
            <p className="text-sm text-muted-foreground">
              Send a partial update. Only the fields you include will change.
            </p>
          </Step>

          <Step number={4} title="Export a PDF">
            <CodeBlock>
              {`curl -X POST ${API_BASE}/api/agent/resumes/RESUME_ID/export \\
  -H "X-Api-Key: brag_sk_live_YOUR_KEY" \\
  --output resume.pdf`}
            </CodeBlock>
            <p className="text-sm text-muted-foreground">
              Downloads a rendered PDF using your chosen template and paper size.
            </p>
          </Step>
        </section>

        {/* Authentication */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Authentication
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            The API supports two authentication methods:
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-card rounded-md border border-border p-3">
              <p className="text-sm font-medium text-foreground mb-1">
                API Key (recommended for agents)
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Pass your key in the <code className="font-mono">X-Api-Key</code>{" "}
                header. Keys are scoped to your account and can be revoked at any
                time.
              </p>
              <CodeBlock>{`X-Api-Key: brag_sk_live_...`}</CodeBlock>
            </div>

            <div className="bg-card rounded-md border border-border p-3">
              <p className="text-sm font-medium text-foreground mb-1">
                Bearer Token (for browser-based integrations)
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Use a Firebase ID token from your authenticated session.
              </p>
              <CodeBlock>{`Authorization: Bearer <firebase-id-token>`}</CodeBlock>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Base URL:{" "}
            <code className="font-mono">{API_BASE}</code>
          </p>
        </section>

        {/* Agent Examples */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Agent Examples
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Job-Tailored Resume Agent
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                An agent that reads a job description, fetches your resume, and
                creates a tailored version:
              </p>
              <CodeBlock>
                {`# 1. Fetch your default resume
resume=$(curl -s ${API_BASE}/api/agent/resumes \\
  -H "X-Api-Key: $API_KEY" | jq '.resumes[] | select(.isDefault)')

RESUME_ID=$(echo $resume | jq -r '.resumeId')

# 2. Get the full content
content=$(curl -s ${API_BASE}/api/agent/resumes/$RESUME_ID \\
  -H "X-Api-Key: $API_KEY")

# 3. Create a tailored copy
curl -X POST ${API_BASE}/api/agent/resumes \\
  -H "X-Api-Key: $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title": "Tailored - Acme Corp", "markdown": "..."}'`}
              </CodeBlock>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                CI/CD PDF Pipeline
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Export a fresh PDF on every deploy and upload it as an artifact:
              </p>
              <CodeBlock>
                {`# GitHub Actions example
- name: Export Resume PDF
  run: |
    curl -X POST ${API_BASE}/api/agent/resumes/$RESUME_ID/export \\
      -H "X-Api-Key: \${{ secrets.BRAGSHEET_API_KEY }}" \\
      --output resume.pdf

- uses: actions/upload-artifact@v4
  with:
    name: resume
    path: resume.pdf`}
              </CodeBlock>
            </div>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-10">
          <h2 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">
            Rate Limits & Best Practices
          </h2>
          <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
            <li>API keys are limited to 60 requests per minute</li>
            <li>PDF exports are limited to 10 per hour per user</li>
            <li>You can have up to 3 active API keys at a time</li>
            <li>
              Use partial updates (PUT) instead of replacing entire resumes when
              possible
            </li>
            <li>
              Cache template IDs locally (they rarely change)
            </li>
          </ul>
        </section>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <Link
            to="/docs"
            className="text-sm text-primary hover:text-brand-600 font-medium"
          >
            View Full API Reference &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}
