import * as React from "react";
import { Link } from "react-router-dom";
import { Check, Copy } from "lucide-react";
import { LandingNav } from "../components/layout/LandingNav";
import { Button } from "../components/ui/Button";
import { PRO_PRICE_MONTHLY } from "../constants/pricing";

// ---------------------------------------------------------------------------
// Typing animation hook
// ---------------------------------------------------------------------------

const MARKDOWN_LINES = [
  "# Alex Chen",
  "Senior Frontend Engineer",
  "alex@email.com | San Francisco, CA",
  "",
  "## Experience",
  "",
  "### Lead Engineer, Acme Inc.",
  "2022 - Present",
  "- Led migration to React 19, reducing bundle size by 40%",
  "- Built real-time collaboration features serving 50K DAU",
  "- Mentored team of 6 engineers across 3 time zones",
  "",
  "### Frontend Developer, StartupCo",
  "2019 - 2022",
  "- Architected design system used across 12 products",
  "- Improved Lighthouse score from 45 to 98",
  "",
  "## Skills",
  "TypeScript, React, Next.js, Node.js, GraphQL, AWS",
];

// Pre-typed lines (visible from the start) and lines typed live
const PRE_TYPED_COUNT = 8;
const FULL_TEXT = MARKDOWN_LINES.join("\n");
const PRE_TYPED_TEXT = MARKDOWN_LINES.slice(0, PRE_TYPED_COUNT).join("\n");

function useTypingAnimation(startTyping: boolean) {
  const [charIndex, setCharIndex] = React.useState(PRE_TYPED_TEXT.length);

  React.useEffect(() => {
    if (!startTyping) return;
    if (charIndex >= FULL_TEXT.length) return;

    const char = FULL_TEXT[charIndex];
    const delay = char === "\n" ? 120 : 28 + Math.random() * 18;

    const timer = setTimeout(() => {
      setCharIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [startTyping, charIndex]);

  return FULL_TEXT.slice(0, charIndex);
}

// ---------------------------------------------------------------------------
// Markdown syntax highlighter (simple)
// ---------------------------------------------------------------------------

function highlightMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    let className = "text-stone-400";
    if (line.startsWith("# ")) className = "text-amber-400 font-bold text-sm";
    else if (line.startsWith("## ")) className = "text-amber-400 font-semibold";
    else if (line.startsWith("### ")) className = "text-orange-300";
    else if (line.startsWith("- ")) className = "text-stone-300";
    else if (/^\d{4}/.test(line)) className = "text-stone-500 italic";
    else if (line.includes("@") || line.includes("|")) className = "text-stone-500";
    return (
      <div key={i} className={className} style={{ minHeight: "1.3em" }}>
        {line || "\u00A0"}
      </div>
    );
  });
}

// ---------------------------------------------------------------------------
// Resume preview renderer (formatted from current typed text)
// ---------------------------------------------------------------------------

function ResumePreview({ markdown }: { markdown: string }) {
  const lines = markdown.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("# ")) {
      // Collect the header block (name + following non-section lines)
      const headerLines: string[] = [line.slice(2)];
      while (i + 1 < lines.length && lines[i + 1].trim() !== "" && !lines[i + 1].startsWith("#")) {
        i++;
        headerLines.push(lines[i]);
      }
      elements.push(
        <div key={i} className="text-center mb-1">
          <div className="text-xs font-bold text-stone-900">{headerLines[0]}</div>
          {headerLines.slice(1).map((hl, j) => (
            <div key={`h${j}`} className="text-[7px] text-stone-500">{hl}</div>
          ))}
        </div>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <div key={i} className="mt-2 mb-0.5 border-b border-stone-200 pb-0.5">
          <div className="text-[7px] font-bold text-stone-700 uppercase tracking-wider">{line.slice(3)}</div>
        </div>
      );
    } else if (line.startsWith("### ")) {
      const text = line.slice(4);
      elements.push(
        <div key={i} className="mt-1">
          <span className="text-[8px] font-semibold text-stone-800">{text}</span>
        </div>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={i} className="flex gap-1 ml-1">
          <span className="text-[7px] text-stone-400">&#8226;</span>
          <span className="text-[7px] text-stone-600 leading-tight">{line.slice(2)}</span>
        </div>
      );
    } else if (/^\d{4}/.test(line)) {
      elements.push(
        <div key={i} className="text-[7px] text-stone-400 italic">{line}</div>
      );
    } else if (line.includes("@") || line.includes("|")) {
      elements.push(
        <div key={i} className="text-[7px] text-stone-500 text-center">{line}</div>
      );
    } else if (line.trim() === "") {
      // skip blank lines in preview
    } else {
      elements.push(
        <div key={i} className="text-[7px] text-stone-600">{line}</div>
      );
    }
  }

  return <>{elements}</>;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero() {
  const [isVisible, setIsVisible] = React.useState(false);
  const heroRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.3 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  const typedText = useTypingAnimation(isVisible);

  return (
    <section className="pt-28 pb-20 px-6" ref={heroRef}>
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground leading-[1.1] tracking-tight">
          The resume builder
          <br />
          <span className="text-accent">developers actually use.</span>
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto">
          Write in Markdown. Pick a template. Export a pixel-perfect
          one-page PDF or share a public link. No fluff.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link to="/sign-up">
            <Button variant="primary" className="text-sm px-6 py-2.5">
              Build yours free
            </Button>
          </Link>
          <a href="#templates" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
            Browse templates &rarr;
          </a>
        </div>
      </div>

      {/* Animated browser mockup */}
      <div className="max-w-4xl mx-auto">
        <div className="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-100 border-b border-border">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="text-xs text-stone-400 bg-white rounded px-12 py-1 border border-stone-200">
                onesheet.cv/editor
              </div>
            </div>
          </div>

          {/* Split editor */}
          <div className="flex min-h-[350px] md:min-h-[420px]">
            {/* Markdown editor pane */}
            <div className="w-1/2 bg-stone-900 p-4 md:p-6 font-mono text-[11px] md:text-xs leading-relaxed overflow-hidden relative">
              {highlightMarkdown(typedText)}
              {/* Blinking cursor */}
              {typedText.length < FULL_TEXT.length && (
                <span className="inline-block w-[2px] h-[14px] bg-amber-400 ml-[1px] animate-pulse absolute" />
              )}
            </div>

            {/* Divider handle */}
            <div className="w-px bg-stone-700 relative">
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-8 bg-stone-600 rounded-full flex items-center justify-center">
                <div className="w-px h-3 bg-stone-400" />
              </div>
            </div>

            {/* Preview pane */}
            <div className="w-1/2 bg-white p-4 md:p-8 overflow-hidden">
              <div className="max-w-[240px] mx-auto">
                <ResumePreview markdown={typedText} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Ink Divider (signature element)
// ---------------------------------------------------------------------------

function InkDivider() {
  return (
    <div className="w-full overflow-hidden py-4">
      <svg viewBox="0 0 1200 24" fill="none" className="w-full h-6 text-border" preserveAspectRatio="none">
        <path
          d="M0 12 Q200 0, 400 12 T800 12 T1200 12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Features Bento Grid
// ---------------------------------------------------------------------------

function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-accent font-semibold text-sm tracking-wide uppercase mb-2">Features</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Everything you need.<br />Nothing you don't.
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Markdown Editor - large card */}
          <div className="md:col-span-2 rounded-xl border border-border bg-card p-6 overflow-hidden">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Markdown-first editing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              No drag-and-drop. No formatting toolbar. Write your resume in the format you already know. Live preview updates as you type.
            </p>
            <div className="rounded-lg overflow-hidden border border-border flex h-36">
              <div className="w-1/2 bg-stone-900 p-3 font-mono text-[9px] text-stone-300 leading-relaxed">
                <div className="text-amber-400 font-bold"># Alex Chen</div>
                <div className="text-stone-500">Senior Frontend Engineer</div>
                <div className="mt-1 text-amber-400">## Experience</div>
                <div className="text-orange-300">### Lead Engineer, Acme</div>
                <div className="text-stone-500 italic">2022 - Present</div>
                <div>- Led migration to React 19</div>
                <div>- Built collab features for 50K DAU</div>
              </div>
              <div className="w-1/2 bg-white p-3 text-[8px] text-stone-700">
                <div className="text-center font-bold text-[9px]">Alex Chen</div>
                <div className="text-center text-[7px] text-stone-500">Senior Frontend Engineer</div>
                <div className="mt-1 border-b border-stone-200 pb-0.5 text-[6px] font-bold uppercase tracking-wider text-stone-600">Experience</div>
                <div className="mt-0.5 font-semibold text-[7px]">Lead Engineer, Acme</div>
                <div className="text-[6px] text-stone-400">2022 - Present</div>
                <div className="text-[6px]">&bull; Led migration to React 19</div>
                <div className="text-[6px]">&bull; Built collab features for 50K DAU</div>
              </div>
            </div>
          </div>

          {/* AI Polish card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">AI that earns its keep</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Polish bullets into quantified achievements. Score against a job description. Import from a URL.
            </p>
            <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="text-accent">&#10024;</span> AI Polish
              </div>
              <div className="rounded bg-stone-200/60 px-2 py-1 text-[9px] text-stone-500 line-through">
                Worked on React projects and helped the team
              </div>
              <div className="text-accent text-[10px]">&darr;</div>
              <div className="rounded bg-green-50 border border-green-200 px-2 py-1 text-[9px] text-stone-700">
                Led migration of 3 React apps to Next.js, reducing page load times by 62%
              </div>
            </div>
          </div>

          {/* Templates mini-card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">5 distinct templates</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Classic serif, clean sans, monospace dev, compact two-column, and minimal.
            </p>
            <div className="flex gap-1.5">
              {/* Mini template thumbnails */}
              <div className="flex-1 h-20 rounded border border-border bg-white p-1.5">
                <div className="h-1 w-6 bg-stone-800 rounded-sm mx-auto mb-0.5" />
                <div className="h-0.5 w-4 bg-stone-400 rounded-sm mx-auto mb-1" />
                <div className="h-px w-full bg-stone-200 mb-0.5" />
                <div className="space-y-0.5">
                  <div className="h-0.5 w-full bg-stone-200 rounded-sm" />
                  <div className="h-0.5 w-3/4 bg-stone-200 rounded-sm" />
                  <div className="h-0.5 w-5/6 bg-stone-200 rounded-sm" />
                </div>
              </div>
              <div className="flex-1 h-20 rounded border border-border bg-white p-1.5 flex">
                <div className="w-1 bg-accent/30 rounded-sm mr-1" />
                <div className="flex-1">
                  <div className="h-1 w-5 bg-stone-800 rounded-sm mb-1" />
                  <div className="space-y-0.5">
                    <div className="h-0.5 w-full bg-stone-200 rounded-sm" />
                    <div className="h-0.5 w-3/4 bg-stone-200 rounded-sm" />
                    <div className="h-0.5 w-5/6 bg-stone-200 rounded-sm" />
                  </div>
                </div>
              </div>
              <div className="flex-1 h-20 rounded border border-border bg-white p-1.5 font-mono">
                <div className="h-0.5 w-5 bg-stone-600 rounded-sm mb-1" />
                <div className="border border-stone-200 rounded-sm p-0.5 mb-0.5">
                  <div className="h-0.5 w-full bg-stone-200 rounded-sm" />
                </div>
                <div className="border border-stone-200 rounded-sm p-0.5">
                  <div className="h-0.5 w-3/4 bg-stone-200 rounded-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Job Match card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Job match scoring</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Paste a job posting. Get a score and actionable suggestions to improve your fit.
            </p>
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="text-accent">&#10024;</span> Job Match
                </span>
                <span className="text-sm font-bold text-success">87%</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-success to-success/70 rounded-full" style={{ width: "87%" }} />
              </div>
              <p className="text-[9px] text-muted-foreground mt-1.5">Strong match. Consider adding Kubernetes experience.</p>
            </div>
          </div>

          {/* PDF + Share wide card */}
          <div className="md:col-span-1 rounded-xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Export and share</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Pixel-perfect PDF that survives any ATS. Or share a public link with your own brand.
            </p>
            <div className="flex gap-3">
              <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                <div className="text-2xl mb-1">&#128196;</div>
                <div className="text-[10px] font-medium text-foreground">PDF Export</div>
                <div className="text-[8px] text-muted-foreground">ATS-optimized</div>
              </div>
              <div className="flex-1 rounded-lg border border-border bg-muted/50 p-3 text-center">
                <div className="text-2xl mb-1">&#127760;</div>
                <div className="text-[10px] font-medium text-foreground">Public Link</div>
                <div className="text-[8px] text-muted-foreground font-mono">onesheet.cv/you</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Template Showcase (each visually distinct)
// ---------------------------------------------------------------------------

function TemplateShowcase() {
  const templates = [
    {
      name: "Classic",
      desc: "Traditional serif, ATS-friendly",
      render: (
        <div className="p-3 h-full" style={{ fontFamily: "'Crimson Text', serif" }}>
          <div className="text-center mb-1">
            <div className="text-[9px] font-bold text-stone-900">Alex Chen</div>
            <div className="text-[6px] text-stone-500">Senior Frontend Engineer</div>
            <div className="text-[5px] text-stone-400">alex@email.com | San Francisco, CA</div>
          </div>
          <div className="border-t border-stone-300 my-1" />
          <div className="text-[6px] font-bold text-stone-700 uppercase tracking-wider mb-0.5">Experience</div>
          <div className="flex justify-between">
            <span className="text-[6px] font-semibold text-stone-800">Lead Engineer, Acme Inc.</span>
            <span className="text-[5px] text-stone-400 italic">2022 - Present</span>
          </div>
          <div className="text-[5px] text-stone-600 ml-1">&bull; Led migration to React 19</div>
          <div className="text-[5px] text-stone-600 ml-1">&bull; Built collab features for 50K DAU</div>
          <div className="flex justify-between mt-1">
            <span className="text-[6px] font-semibold text-stone-800">Developer, StartupCo</span>
            <span className="text-[5px] text-stone-400 italic">2019 - 2022</span>
          </div>
          <div className="text-[5px] text-stone-600 ml-1">&bull; Architected design system</div>
          <div className="border-t border-stone-300 my-1" />
          <div className="text-[6px] font-bold text-stone-700 uppercase tracking-wider mb-0.5">Skills</div>
          <div className="text-[5px] text-stone-600">TypeScript, React, Next.js, Node.js</div>
        </div>
      ),
    },
    {
      name: "Modern",
      desc: "Clean sans-serif with color accents",
      render: (
        <div className="flex h-full" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          <div className="w-1.5 bg-accent/20 flex-shrink-0" />
          <div className="p-3 flex-1">
            <div className="text-[9px] font-bold text-stone-900 mb-0.5">Alex Chen</div>
            <div className="text-[5px] text-accent font-semibold uppercase tracking-widest mb-1.5">Senior Frontend Engineer</div>
            <div className="text-[5px] font-bold text-accent uppercase tracking-wider mb-0.5">Experience</div>
            <div className="text-[6px] font-semibold text-stone-800">Lead Engineer, Acme Inc.</div>
            <div className="text-[5px] text-stone-400">2022 - Present</div>
            <div className="text-[5px] text-stone-600 mt-0.5">&bull; Led migration to React 19</div>
            <div className="text-[5px] text-stone-600">&bull; Built collab features for 50K DAU</div>
            <div className="mt-1 text-[6px] font-semibold text-stone-800">Developer, StartupCo</div>
            <div className="text-[5px] text-stone-400">2019 - 2022</div>
            <div className="mt-1.5 text-[5px] font-bold text-accent uppercase tracking-wider mb-0.5">Skills</div>
            <div className="flex gap-0.5 flex-wrap">
              <span className="text-[4px] bg-accent/10 text-accent px-1 rounded">TypeScript</span>
              <span className="text-[4px] bg-accent/10 text-accent px-1 rounded">React</span>
              <span className="text-[4px] bg-accent/10 text-accent px-1 rounded">Next.js</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: "Minimal",
      desc: "Maximum whitespace, understated",
      render: (
        <div className="p-4 h-full" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          <div className="text-[9px] font-semibold text-stone-900 tracking-tight">Alex Chen</div>
          <div className="text-[5px] text-stone-400 mt-0.5 mb-3">Senior Frontend Engineer &middot; San Francisco</div>
          <div className="text-[5px] text-stone-400 uppercase tracking-[0.15em] mb-1">Experience</div>
          <div className="text-[6px] text-stone-800 font-medium">Lead Engineer, Acme Inc.</div>
          <div className="text-[5px] text-stone-500 mt-0.5">Led migration to React 19</div>
          <div className="text-[5px] text-stone-500">Built collab features for 50K DAU</div>
          <div className="mt-2 text-[6px] text-stone-800 font-medium">Developer, StartupCo</div>
          <div className="text-[5px] text-stone-500 mt-0.5">Architected design system</div>
          <div className="mt-3 text-[5px] text-stone-400 uppercase tracking-[0.15em] mb-0.5">Skills</div>
          <div className="text-[5px] text-stone-600">TypeScript, React, Next.js, Node.js</div>
        </div>
      ),
    },
    {
      name: "Technical",
      desc: "Monospace developer style",
      render: (
        <div className="p-3 h-full bg-stone-50" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="text-[8px] font-bold text-stone-900">$ whoami</div>
          <div className="text-[6px] text-stone-600 mb-1.5">Alex Chen // Senior Frontend Engineer</div>
          <div className="border border-stone-300 rounded p-1.5 mb-1.5">
            <div className="text-[5px] font-bold text-stone-700 uppercase mb-0.5">// Experience</div>
            <div className="text-[5px] text-stone-800 font-semibold">Lead Engineer @ Acme Inc.</div>
            <div className="text-[5px] text-stone-500">2022-present</div>
            <div className="text-[5px] text-stone-600 mt-0.5">- React 19 migration (-40% bundle)</div>
            <div className="text-[5px] text-stone-600">- Collab features, 50K DAU</div>
          </div>
          <div className="border border-stone-300 rounded p-1.5">
            <div className="text-[5px] font-bold text-stone-700 uppercase mb-0.5">// Skills</div>
            <div className="text-[5px] text-stone-600">ts | react | next | node | gql</div>
          </div>
        </div>
      ),
    },
    {
      name: "Compact",
      desc: "Two-column high density layout",
      render: (
        <div className="p-2 h-full flex gap-2" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          <div className="w-1/3 bg-stone-100 rounded p-1.5">
            <div className="text-[7px] font-bold text-stone-900 mb-1">Alex Chen</div>
            <div className="text-[4px] text-stone-500 mb-1.5">Frontend Engineer<br />San Francisco, CA</div>
            <div className="text-[4px] font-bold text-stone-700 uppercase mb-0.5">Skills</div>
            <div className="text-[4px] text-stone-600 leading-relaxed">TypeScript<br />React<br />Next.js<br />Node.js<br />GraphQL</div>
          </div>
          <div className="flex-1">
            <div className="text-[5px] font-bold text-stone-700 uppercase mb-0.5">Experience</div>
            <div className="text-[5px] font-semibold text-stone-800">Lead Engineer, Acme</div>
            <div className="text-[4px] text-stone-400">2022 - Present</div>
            <div className="text-[4px] text-stone-600">&bull; React 19 migration</div>
            <div className="text-[4px] text-stone-600">&bull; 50K DAU collab features</div>
            <div className="text-[4px] text-stone-600">&bull; Mentored 6 engineers</div>
            <div className="mt-1 text-[5px] font-semibold text-stone-800">Developer, StartupCo</div>
            <div className="text-[4px] text-stone-400">2019 - 2022</div>
            <div className="text-[4px] text-stone-600">&bull; Design system (12 products)</div>
            <div className="text-[4px] text-stone-600">&bull; Lighthouse 45 to 98</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="templates" className="py-20 px-6 bg-muted/40">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-accent font-semibold text-sm tracking-wide uppercase mb-2">Templates</p>
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Choose your format.
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto mb-10">
          Five styles for different roles and industries. Each renders to a single, print-ready page.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {templates.map((t) => (
            <div key={t.name} className="group">
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden h-48 transition-shadow hover:shadow-md">
                {t.render}
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Agents Section — terminal-centric, shows API in action
// ---------------------------------------------------------------------------

const AGENT_PROMPT = `# OneSheet Resume Agent
# Paste this into your AI agent's system prompt

You have access to the OneSheet API.
Docs: https://onesheet.cv/docs

When building or updating a resume:
1. GET /api/agent/resumes to list existing resumes
2. Ask the user for any missing details
3. Never fabricate experience or skills
4. PUT /api/agent/resumes/:id to update
5. Show the draft for approval before publishing
6. POST /api/agent/resumes/:id/export for PDF`;

function AgentsSection() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(AGENT_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 px-6 bg-primary">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-accent font-semibold text-sm tracking-wide uppercase mb-2">API + Agents</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white leading-tight mb-3">
            Your resume has an API.
          </h2>
          <p className="text-stone-400 max-w-lg mx-auto">
            Create, update, and export resumes programmatically. Wire it into your AI agent, CI/CD pipeline, or custom tooling.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6 items-start">
          {/* Terminal mockup — 3 cols */}
          <div className="md:col-span-3 rounded-xl overflow-hidden border border-stone-700 shadow-2xl">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-800 border-b border-stone-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-[11px] text-stone-500 font-mono ml-2">terminal</span>
            </div>
            <div className="bg-stone-900 p-5 font-mono text-[12px] md:text-[13px] leading-relaxed">
              <div className="text-stone-500"># Create a tailored resume with one API call</div>
              <div className="mt-2">
                <span className="text-green-400">$</span>{" "}
                <span className="text-stone-300">curl -X POST onesheet.cv/api/agent/resumes \</span>
              </div>
              <div className="text-stone-300 ml-4">-H &quot;X-Api-Key: $KEY&quot; \</div>
              <div className="text-stone-300 ml-4">-d &apos;&#123;&quot;title&quot;: &quot;Acme Corp&quot;, &quot;markdown&quot;: &quot;# ...&quot;&#125;&apos;</div>
              <div className="mt-3 text-stone-500">&#123;</div>
              <div className="text-stone-500 ml-4">&quot;resumeId&quot;: <span className="text-amber-300">&quot;r_3kf9x&quot;</span>,</div>
              <div className="text-stone-500 ml-4">&quot;status&quot;: <span className="text-green-400">&quot;created&quot;</span>,</div>
              <div className="text-stone-500 ml-4">&quot;url&quot;: <span className="text-amber-300">&quot;onesheet.cv/alex&quot;</span></div>
              <div className="text-stone-500">&#125;</div>
              <div className="mt-3">
                <span className="text-green-400">$</span>{" "}
                <span className="text-stone-300">curl -X POST .../r_3kf9x/export \</span>
              </div>
              <div className="text-stone-300 ml-4">--output resume.pdf</div>
              <div className="mt-1 text-green-400">&#10003; Saved resume.pdf (1 page, 142KB)</div>
            </div>
          </div>

          {/* System prompt card — 2 cols */}
          <div className="md:col-span-2 rounded-xl overflow-hidden border border-stone-700 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-800 border-b border-stone-700">
              <span className="text-[11px] text-stone-400 font-mono">system-prompt.md</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    <span className="text-green-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-stone-900 p-5 font-mono text-[11px] md:text-[12px] leading-relaxed whitespace-pre-wrap">
              {AGENT_PROMPT.split("\n").map((line, i) => {
                if (line.startsWith("#")) return <div key={i} className="text-stone-500">{line}</div>;
                if (/^\d\./.test(line)) return <div key={i} className="text-stone-300">{line}</div>;
                if (line.startsWith("Docs:") || line.startsWith("You have")) return <div key={i} className="text-amber-300">{line}</div>;
                if (line.startsWith("When")) return <div key={i} className="text-stone-300 mt-1">{line}</div>;
                return <div key={i} className="text-stone-300">{line || "\u00A0"}</div>;
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4">
          <Link to="/agents" className="inline-flex items-center gap-2 text-sm font-medium bg-white text-primary px-5 py-2.5 rounded-lg hover:bg-stone-100 transition-colors">
            Agent guide
          </Link>
          <Link to="/docs" className="inline-flex items-center gap-2 text-sm font-medium border border-stone-600 text-stone-300 px-5 py-2.5 rounded-lg hover:bg-stone-800 transition-colors">
            Full API docs
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

function Pricing() {
  const freeFeatures = [
    "Markdown editor with live preview",
    "1 resume",
    "Classic template",
    "Public profile page",
    "Version history",
  ];

  const proFeatures = [
    "Everything in Free, plus:",
    "Up to 3 resumes",
    "All 5 templates",
    "PDF export (ATS-optimized)",
    "AI bullet polish + job match",
    "Custom QR code on profile",
    "No OneSheet branding",
    "API access for agents",
  ];

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-accent font-semibold text-sm tracking-wide uppercase mb-2">Pricing</p>
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Simple, honest pricing
        </h2>
        <p className="text-muted-foreground mb-10">
          Start free. Upgrade when you need PDF export and all templates.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-xl border border-border bg-card p-8 text-left">
            <h3 className="font-heading text-xl font-semibold text-foreground">Free</h3>
            <p className="text-3xl font-bold text-foreground mt-2">$0</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Forever free</p>
            <ul className="space-y-2.5">
              {freeFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/sign-up" className="block mt-8">
              <Button variant="secondary" className="w-full text-sm">
                Get started
              </Button>
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-xl border-2 border-accent bg-card p-8 text-left relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-3 py-0.5 rounded-full">
              Popular
            </div>
            <h3 className="font-heading text-xl font-semibold text-foreground">Pro</h3>
            <p className="text-3xl font-bold text-foreground mt-2">${PRO_PRICE_MONTHLY}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Cancel anytime</p>
            <ul className="space-y-2.5">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/sign-up" className="block mt-8">
              <Button variant="primary" className="w-full text-sm">
                Upgrade to Pro
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCTA() {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <img
        src="/images/cta-professional.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-primary/90" />
      <div className="relative max-w-2xl mx-auto text-center">
        <h2 className="font-heading text-3xl md:text-4xl font-semibold text-white mb-4">
          Stop overthinking your resume.
        </h2>
        <p className="text-white/60 mb-8 max-w-md mx-auto">
          Markdown in, polished PDF out. Free to start, ready in minutes.
        </p>
        <Link to="/sign-up">
          <Button
            variant="primary"
            className="bg-white text-foreground hover:bg-white/90 text-sm px-6 py-2.5"
          >
            Build yours free
          </Button>
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="OneSheet" className="h-5" />
        </Link>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/docs" className="hover:text-foreground transition-colors">API</Link>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

export function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <Hero />
      <InkDivider />
      <Features />
      <TemplateShowcase />
      <AgentsSection />
      <Pricing />
      <FinalCTA />
      <Footer />
    </div>
  );
}
