import * as React from "react";
import { X, Sparkles, Target, Upload, Zap, Maximize2, Minimize2, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "../ui/Button";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  polishBullets,
  scoreResume,
  extractJobFromUrl,
  importResumeText,
  saveScore,
  getScoreHistory,
  type SavedScore,
} from "../../services/ai";

type Tab = "polish" | "score" | "import";

interface AIToolsPanelProps {
  markdown: string;
  onMarkdownChange: (md: string) => void;
  onClose: () => void;
  resumeId?: string;
}

// ---------------------------------------------------------------------------
// Bullet Polisher Tab
// ---------------------------------------------------------------------------

function PolishTab({ markdown, onMarkdownChange }: Pick<AIToolsPanelProps, "markdown" | "onMarkdownChange">) {
  const [isPolishing, setIsPolishing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [preview, setPreview] = React.useState<{ original: string[]; polished: string[] } | null>(null);

  const bullets = React.useMemo(
    () =>
      markdown
        .split("\n")
        .filter((line) => /^[-*]\s+/.test(line.trim()))
        .map((line) => line.trim().replace(/^[-*]\s+/, "")),
    [markdown]
  );

  async function handlePolish() {
    if (bullets.length === 0) return;
    setIsPolishing(true);
    setError("");
    setPreview(null);
    try {
      const polished = await polishBullets(bullets);
      setPreview({ original: bullets, polished });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to polish bullets");
    } finally {
      setIsPolishing(false);
    }
  }

  function handleApply() {
    if (!preview) return;
    let updated = markdown;
    preview.original.forEach((orig, i) => {
      if (preview.polished[i]) {
        updated = updated.replace(orig, preview.polished[i]);
      }
    });
    onMarkdownChange(updated);
    setPreview(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        AI will polish your resume bullet points with stronger action verbs and quantified metrics.
      </p>

      {bullets.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No bullet points found. Add some with - or * in your markdown.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{bullets.length} bullet point{bullets.length !== 1 ? "s" : ""} found</p>
          <Button variant="primary" onClick={handlePolish} isLoading={isPolishing} className="text-sm">
            Polish All Bullets
          </Button>
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {preview && (
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Preview Changes</h4>
          <div className="max-h-64 overflow-y-auto space-y-3">
            {preview.polished.map((p, i) => (
              <div key={i} className="border border-border rounded-md p-2.5 text-xs">
                <p className="text-muted-foreground line-through mb-1">{preview.original[i]}</p>
                <p className="text-foreground">{p}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleApply} className="text-xs flex-1">
              Apply Changes
            </Button>
            <Button variant="secondary" onClick={() => setPreview(null)} className="text-xs">
              Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Job Score Tab
// ---------------------------------------------------------------------------

function ScoreTab({ markdown, resumeId }: { markdown: string; resumeId?: string }) {
  const [url, setUrl] = React.useState("");
  const [jobText, setJobText] = React.useState("");
  const [isScoring, setIsScoring] = React.useState(false);
  const [isFetching, setIsFetching] = React.useState(false);
  const [error, setError] = React.useState("");
  const [result, setResult] = React.useState<{
    score: number;
    matches: string[];
    gaps: string[];
    suggestions: string[];
  } | null>(null);

  // Score history
  const [history, setHistory] = React.useState<SavedScore[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  // Load history on mount
  React.useEffect(() => {
    if (!resumeId) return;
    getScoreHistory(resumeId, 10).then(setHistory).catch(() => {});
  }, [resumeId]);

  const previousScore = history.length > 0 ? history[0].score : null;

  async function handleFetchUrl() {
    if (!url.trim()) return;
    setIsFetching(true);
    setError("");
    try {
      const text = await extractJobFromUrl(url.trim());
      setJobText(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch URL");
    } finally {
      setIsFetching(false);
    }
  }

  async function handleScore() {
    if (!jobText.trim()) return;
    setIsScoring(true);
    setError("");
    setResult(null);
    try {
      const data = await scoreResume(markdown, jobText.trim());
      setResult(data);

      // Auto-save score
      if (resumeId) {
        try {
          await saveScore(resumeId, data, jobText.trim());
          // Refresh history
          const updated = await getScoreHistory(resumeId, 10);
          setHistory(updated);
        } catch {
          // score display still works even if save fails
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to score resume");
    } finally {
      setIsScoring(false);
    }
  }

  const scoreColor = result
    ? result.score >= 80
      ? "text-success"
      : result.score >= 50
        ? "text-warning"
        : "text-destructive"
    : "";

  // Compute delta from the score before this one (index 1 since index 0 is the current)
  const compareScore = history.length > 1 ? history[1].score : null;
  const delta = result && compareScore != null ? result.score - compareScore : null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Paste a job listing URL or description to see how well your resume matches.
      </p>

      {/* URL input */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground">Job listing URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 h-8 px-2.5 text-xs rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <Button
            variant="secondary"
            onClick={handleFetchUrl}
            isLoading={isFetching}
            className="text-xs whitespace-nowrap"
            disabled={!url.trim()}
          >
            Fetch
          </Button>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-border" />
        <span className="text-xs text-muted-foreground">or paste description</span>
        <div className="flex-1 border-t border-border" />
      </div>

      {/* Text input */}
      <textarea
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
        placeholder="Paste the job description here..."
        rows={6}
        className="w-full px-2.5 py-2 text-xs rounded-md border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      />

      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={handleScore}
          isLoading={isScoring}
          className="text-sm flex-1"
          disabled={!jobText.trim()}
        >
          Score Match
        </Button>
        {history.length > 0 && (
          <Button
            variant="secondary"
            onClick={() => setShowHistory(!showHistory)}
            className="text-xs"
            title="Score history"
          >
            <History className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Score result */}
      {result && (
        <div className="flex flex-col gap-3 border-t border-border pt-3">
          <div className="text-center">
            <span className={`text-3xl font-bold ${scoreColor}`}>{result.score}</span>
            <span className="text-sm text-muted-foreground">/100</span>
            {delta != null && delta !== 0 && (
              <span className={`ml-2 inline-flex items-center gap-0.5 text-sm font-medium ${delta > 0 ? "text-success" : "text-destructive"}`}>
                {delta > 0 ? <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} /> : <TrendingDown className="w-3.5 h-3.5" strokeWidth={2} />}
                {delta > 0 ? "+" : ""}{delta}
              </span>
            )}
            {delta === 0 && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-sm font-medium text-muted-foreground">
                <Minus className="w-3.5 h-3.5" strokeWidth={2} />
                No change
              </span>
            )}
          </div>

          {previousScore != null && result.score !== previousScore && (
            <p className="text-[11px] text-muted-foreground text-center">
              Previous score: {compareScore ?? previousScore}
            </p>
          )}

          {result.matches.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-success mb-1">Matching Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {result.matches.map((m, i) => (
                  <span key={i} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full border border-success/20">{m}</span>
                ))}
              </div>
            </div>
          )}

          {result.gaps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-destructive mb-1">Missing Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {result.gaps.map((g, i) => (
                  <span key={i} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20">{g}</span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-1">Suggestions</h4>
              <ul className="space-y-1">
                {result.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-muted-foreground pl-3 relative before:absolute before:left-0 before:content-['\2022'] before:text-muted-foreground/50">{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Score history */}
      {showHistory && history.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3 h-3" strokeWidth={1.5} />
            Score History
          </h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {history.map((entry, i) => {
              const prev = history[i + 1];
              const d = prev ? entry.score - prev.score : null;
              const color =
                entry.score >= 80
                  ? "text-success"
                  : entry.score >= 50
                    ? "text-warning"
                    : "text-destructive";
              return (
                <div key={entry.id} className="flex items-center gap-2 px-2.5 py-1.5 bg-muted rounded-md text-xs">
                  <span className={`font-bold w-8 ${color}`}>{entry.score}</span>
                  {d != null && d !== 0 && (
                    <span className={`text-[10px] font-medium ${d > 0 ? "text-success" : "text-destructive"}`}>
                      {d > 0 ? "+" : ""}{d}
                    </span>
                  )}
                  <span className="flex-1 text-muted-foreground truncate">{entry.jobSnippet || "Job match"}</span>
                  <span className="text-muted-foreground/50 flex-shrink-0">
                    {entry.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import Tab
// ---------------------------------------------------------------------------

function ImportTab({ onMarkdownChange, onClose }: Pick<AIToolsPanelProps, "onMarkdownChange" | "onClose">) {
  const [text, setText] = React.useState("");
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [preview, setPreview] = React.useState<string | null>(null);

  async function handleImport() {
    if (!text.trim()) return;
    setIsImporting(true);
    setError("");
    setPreview(null);
    try {
      const markdown = await importResumeText(text.trim());
      setPreview(markdown);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import resume");
    } finally {
      setIsImporting(false);
    }
  }

  function handleApply() {
    if (!preview) return;
    onMarkdownChange(preview);
    onClose();
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Paste text from an existing resume (copied from a PDF or document) and AI will convert it to structured markdown.
      </p>

      {!preview ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste your resume text here..."
            rows={10}
            className="w-full px-2.5 py-2 text-xs font-mono rounded-md border border-input resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
          <Button
            variant="primary"
            onClick={handleImport}
            isLoading={isImporting}
            className="text-sm"
            disabled={text.trim().length < 20}
          >
            Convert to Markdown
          </Button>
        </>
      ) : (
        <>
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Preview</h4>
          <pre className="max-h-64 overflow-y-auto text-xs font-mono bg-muted rounded-md p-3 border border-border whitespace-pre-wrap">
            {preview}
          </pre>
          <p className="text-xs text-amber-600">
            This will replace your current resume content.
          </p>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleApply} className="text-xs flex-1">
              Apply
            </Button>
            <Button variant="secondary" onClick={() => setPreview(null)} className="text-xs">
              Back
            </Button>
          </div>
        </>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "polish", label: "Polish", icon: Sparkles },
  { id: "score", label: "Job Match", icon: Target },
  { id: "import", label: "Import", icon: Upload },
];

export function AIToolsPanel({ markdown, onMarkdownChange, onClose, resumeId }: AIToolsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<Tab>("polish");
  const [expanded, setExpanded] = React.useState(false);
  const { user } = useAuthContext();
  const isPro = user?.subscription?.status === "active";

  const panelClass = expanded
    ? "fixed inset-0 z-30 bg-card flex flex-col"
    : "fixed inset-y-0 right-0 z-30 w-[480px] bg-card border-l border-border shadow-xl flex flex-col";

  return (
    <div className={panelClass}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">AI Tools</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={expanded ? "Collapse panel" : "Expand panel"}
            title={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <Minimize2 className="w-4 h-4" strokeWidth={2} />
            ) : (
              <Maximize2 className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close AI tools"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border flex-shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${expanded ? "max-w-2xl mx-auto w-full" : ""}`}>
        {!isPro && (
          <div className="flex items-start gap-2 p-2.5 mb-4 bg-secondary border border-primary/20 rounded-md">
            <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[11px] text-primary leading-relaxed">
              <strong>Pro subscribers</strong> get access to a more powerful AI model for better results.
            </p>
          </div>
        )}
        {activeTab === "polish" && (
          <PolishTab markdown={markdown} onMarkdownChange={onMarkdownChange} />
        )}
        {activeTab === "score" && <ScoreTab markdown={markdown} resumeId={resumeId} />}
        {activeTab === "import" && (
          <ImportTab onMarkdownChange={onMarkdownChange} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
