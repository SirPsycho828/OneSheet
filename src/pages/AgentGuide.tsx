import * as React from "react";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";

const API_BASE = "https://onesheet.cv";

// ---------------------------------------------------------------------------
// Copyable block
// ---------------------------------------------------------------------------

function CopyBlock({ content, filename }: { content: string; filename: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-stone-700 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-800 border-b border-stone-700">
        <span className="text-[11px] text-stone-400 font-mono">{filename}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
          ) : (
            <><Copy className="w-3 h-3" />Copy</>
          )}
        </button>
      </div>
      <pre className="bg-stone-900 p-5 font-mono text-[12px] md:text-[13px] leading-relaxed text-stone-300 overflow-x-auto whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <pre className="text-xs bg-stone-900 text-stone-300 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-stone-800 text-stone-400 hover:text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Copy code"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// The system prompt an agent should use
// ---------------------------------------------------------------------------

const AGENT_SYSTEM_PROMPT = `You are a resume-writing assistant powered by the OneSheet API.

## Your workflow

1. INTERVIEW: Ask the user about their experience, education, skills, and target role. Ask follow-up questions for anything vague or missing. You need enough detail to write quantified bullet points.

2. CHOOSE TEMPLATE: Based on their role, suggest a template:
   - "classic" — Traditional serif, best for corporate/finance/legal
   - "modern" — Clean sans-serif with color, good for tech/startups
   - "minimal" — Maximum whitespace, good for senior/executive roles
   - "technical" — Monospace, ideal for engineers/developers
   - "compact" — Two-column dense layout, good when space is tight

3. DRAFT: Write the resume in Markdown using this structure:

   # Full Name
   email@example.com | City, ST | linkedin.com/in/handle

   ## Summary
   2-3 sentence overview of experience and focus areas.

   ## Experience
   **Job Title** | Company Name | Start -- End
   - Led X initiative, resulting in Y% improvement in Z metric
   - Built/designed/managed [specific thing] serving [scale]
   - Reduced/increased [metric] by [amount] through [action]

   ## Education
   **Degree** | University Name | Year

   ## Skills
   **Category:** Tool1, Tool2, Tool3

4. REVIEW: Show the draft to the user. Ask if anything needs changes. Never proceed without their approval.

5. PUBLISH: Once approved, use the API to create or update the resume:
   POST ${API_BASE}/api/agent/resumes
   PUT  ${API_BASE}/api/agent/resumes/:resumeId

6. EXPORT: If the user wants a PDF:
   POST ${API_BASE}/api/agent/resumes/:resumeId/export

## Rules
- NEVER fabricate experience, skills, education, or metrics
- ALWAYS ask for specifics rather than guessing
- Keep everything to one page
- Use quantified achievements (numbers, percentages, dollar amounts)
- Use strong action verbs: Led, Built, Designed, Reduced, Increased
- Do NOT publish or export until the user explicitly approves

## Authentication
All API calls require: X-Api-Key: <user's API key>
The user can generate a key at https://onesheet.cv/settings

## API Reference
Full docs: https://onesheet.cv/docs
Agent guide: https://onesheet.cv/agents
OpenAPI spec: https://onesheet.cv/openapi.json
LLM context: https://onesheet.cv/llms-full.txt`;

// ---------------------------------------------------------------------------
// Agent Guide Page
// ---------------------------------------------------------------------------

export function AgentGuide() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/90 backdrop-blur-sm flex-shrink-0">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="OneSheet" className="h-6" />
        </Link>
        <div className="w-px h-5 bg-border" aria-hidden />
        <span className="text-sm font-medium text-muted-foreground">Agent Guide</span>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-primary py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <p className="text-accent font-semibold text-sm tracking-wide uppercase mb-3">API + Agents</p>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold text-white leading-tight mb-3">
              Your resume has an API.
            </h1>
            <p className="text-stone-400 max-w-xl mb-4">
              Give your AI agent these instructions. It will interview you, draft your resume in Markdown, and publish it through the OneSheet API.
            </p>
            <p className="text-stone-500 text-sm">
              Works with Claude, ChatGPT, Gemini, or any agent that can make HTTP requests.
            </p>
          </div>
        </section>

        {/* Step 1: Copy the system prompt */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">Copy the agent prompt</h2>
            </div>
            <p className="text-muted-foreground mb-6 ml-11">
              Paste this into your AI agent's system prompt (or custom instructions). It tells the agent how to interview you, format the resume, and use the API.
            </p>
            <div className="ml-11">
              <CopyBlock content={AGENT_SYSTEM_PROMPT} filename="system-prompt.md" />
            </div>
          </div>
        </section>

        {/* Step 2: Get an API key */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">Get an API key</h2>
            </div>
            <p className="text-muted-foreground mb-4 ml-11">
              Go to{" "}
              <Link to="/settings" className="text-accent hover:underline font-medium">Settings</Link>
              {" "}and generate a key under "API Access". Requires a Pro subscription ($8/mo).
            </p>
            <p className="text-sm text-muted-foreground ml-11">
              Your key looks like: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">os_sk_live_a1b2c3d4...</code>
            </p>
            <p className="text-sm text-muted-foreground ml-11 mt-2">
              Give this key to your agent when it asks, or set it as an environment variable.
            </p>
          </div>
        </section>

        {/* Step 3: Start chatting */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
              <h2 className="font-heading text-2xl font-semibold text-foreground">Start chatting</h2>
            </div>
            <p className="text-muted-foreground mb-6 ml-11">
              Tell your agent: "Help me build my resume." It will follow the system prompt to interview you, draft the content, and publish when you approve.
            </p>

            {/* Example conversation */}
            <div className="ml-11 rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/40">
                <span className="text-xs font-medium text-muted-foreground">Example conversation</span>
              </div>
              <div className="p-5 space-y-4 text-sm">
                <div>
                  <span className="font-semibold text-foreground">You:</span>{" "}
                  <span className="text-muted-foreground">Help me build my resume. I'm a frontend engineer looking for senior roles.</span>
                </div>
                <div>
                  <span className="font-semibold text-accent">Agent:</span>{" "}
                  <span className="text-muted-foreground">Great! Let me ask a few questions to get started. What's your current job title and company? How long have you been there?</span>
                </div>
                <div>
                  <span className="font-semibold text-foreground">You:</span>{" "}
                  <span className="text-muted-foreground">I'm a Frontend Engineer at Acme Corp, been here 3 years. Before that I was at StartupCo for 2 years.</span>
                </div>
                <div>
                  <span className="font-semibold text-accent">Agent:</span>{" "}
                  <span className="text-muted-foreground">What are 2-3 things you're most proud of at Acme? Try to include numbers if you can, like users served, performance improvements, or team size.</span>
                </div>
                <div className="text-xs text-muted-foreground italic">
                  ...the agent continues interviewing, then drafts and shows you the resume for approval...
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Markdown format reference */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">Markdown format</h2>
            <p className="text-muted-foreground mb-6">
              OneSheet resumes are written in standard Markdown. Here's the structure the agent should produce:
            </p>

            <CodeBlock>
{`# Full Name

email@example.com | City, ST | linkedin.com/in/handle

## Summary

2-3 sentence professional overview.

## Experience

**Senior Software Engineer** | Acme Corp | 2022 -- Present

- Led migration to React 19, reducing bundle size by 40%
- Built real-time collaboration serving 50K daily active users
- Mentored 6 engineers across 3 time zones

**Software Engineer** | StartupCo | 2019 -- 2022

- Architected design system used across 12 products
- Improved Lighthouse score from 45 to 98

## Education

**B.S. Computer Science** | UC Berkeley | 2019

## Skills

**Languages:** TypeScript, Python, Go
**Frameworks:** React, Node.js, Next.js
**Infrastructure:** AWS, Docker, Kubernetes`}
            </CodeBlock>

            <div className="mt-4 text-sm text-muted-foreground space-y-1">
              <p><strong className="text-foreground">Sections:</strong> Summary, Experience, Education, Skills, Projects, Certifications, Publications</p>
              <p><strong className="text-foreground">Date separator:</strong> Use <code className="font-mono bg-muted px-1 py-0.5 rounded">--</code> between start and end dates</p>
              <p><strong className="text-foreground">Links:</strong> Standard Markdown links <code className="font-mono bg-muted px-1 py-0.5 rounded">[text](url)</code> are supported</p>
              <p><strong className="text-foreground">Bold:</strong> Use <code className="font-mono bg-muted px-1 py-0.5 rounded">**text**</code> for job titles and degree names</p>
            </div>
          </div>
        </section>

        {/* Templates */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">Templates</h2>
            <p className="text-muted-foreground mb-6">Five templates, each designed for different roles. Pass the template ID when creating a resume.</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: "classic", name: "Classic", desc: "Traditional serif, ATS-friendly. Best for corporate, finance, legal, consulting." },
                { id: "modern", name: "Modern", desc: "Clean sans-serif with accent color. Good for tech, startups, product roles." },
                { id: "minimal", name: "Minimal", desc: "Maximum whitespace, understated. Good for senior/executive roles." },
                { id: "technical", name: "Technical", desc: "Monospace developer style. Ideal for software engineers, DevOps, SRE." },
                { id: "compact", name: "Compact", desc: "Two-column dense layout. Use when you have a lot of experience to fit." },
              ].map((t) => (
                <div key={t.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-foreground">{t.name}</span>
                    <code className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{t.id}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Quick Reference */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">API quick reference</h2>
            <p className="text-muted-foreground mb-6">
              All endpoints require <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">X-Api-Key</code> header. Base URL: <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">{API_BASE}</code>
            </p>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">List resumes</h3>
                <CodeBlock>{`GET /api/agent/resumes
# Returns: { resumes: [{ resumeId, title, templateId, isDefault, ... }] }`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Get resume content</h3>
                <CodeBlock>{`GET /api/agent/resumes/:resumeId
# Returns: { resumeId, title, markdown, templateId, ... }`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Create a resume</h3>
                <CodeBlock>{`POST /api/agent/resumes
Content-Type: application/json

{ "title": "My Resume", "templateId": "modern", "markdown": "# ..." }
# Returns: { resumeId: "..." }`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Update a resume</h3>
                <CodeBlock>{`PUT /api/agent/resumes/:resumeId
Content-Type: application/json

{ "markdown": "# Updated content...", "title": "New Title" }
# Returns: { success: true }`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Export PDF</h3>
                <CodeBlock>{`POST /api/agent/resumes/:resumeId/export
# Returns: Binary PDF file (application/pdf)`}</CodeBlock>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">List templates</h3>
                <CodeBlock>{`GET /api/agent/templates
# Returns: { templates: [{ id, name }] }`}</CodeBlock>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              Rate limits: 60 requests/min per key, 10 PDF exports/hour. Full reference at{" "}
              <Link to="/docs" className="text-accent hover:underline font-medium">/docs</Link>.
            </p>
          </div>
        </section>

        {/* Machine-readable resources */}
        <section className="py-14 px-6 border-b border-border">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">Machine-readable resources</h2>
            <p className="text-muted-foreground mb-6">
              For agents that can fetch context automatically:
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <a href="/llms-full.txt" target="_blank" rel="noopener" className="rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-colors">
                <code className="text-xs font-mono text-accent">/llms-full.txt</code>
                <p className="text-sm text-muted-foreground mt-2">Full platform context for LLMs. API docs, markdown format, templates, and agent workflow.</p>
              </a>
              <a href="/openapi.json" target="_blank" rel="noopener" className="rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-colors">
                <code className="text-xs font-mono text-accent">/openapi.json</code>
                <p className="text-sm text-muted-foreground mt-2">OpenAPI 3.0 spec. Import into Postman, use with function-calling agents.</p>
              </a>
              <Link to="/docs" className="rounded-xl border border-border bg-card p-5 hover:border-accent/50 transition-colors">
                <code className="text-xs font-mono text-accent">/docs</code>
                <p className="text-sm text-muted-foreground mt-2">Human-readable API reference with endpoint details and examples.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              Questions? Check the{" "}
              <Link to="/docs" className="text-accent hover:underline font-medium">API docs</Link>
              {" "}or email support.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
