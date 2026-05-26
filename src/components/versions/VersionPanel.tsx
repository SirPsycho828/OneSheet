import * as React from "react";
import { X, Lock } from "lucide-react";
import type { VersionEntry as VersionEntryType } from "../../services/versions";
import { listVersions } from "../../services/versions";
import { VersionEntry } from "./VersionEntry";
import { Button } from "../ui/Button";

interface VersionPanelProps {
  resumeId: string;
  currentTemplateId: string;
  isPaid: boolean;
  onClose: () => void;
  /** Called when the user wants to preview a version (non-destructive) */
  onPreview: (version: VersionEntryType | null) => void;
  /** Called when the user confirms restoring a version */
  onRestore: (versionId: string) => Promise<void>;
  previewingVersion: VersionEntryType | null;
}

const PAGE_SIZE = 20;

/**
 * Right-side slide-over panel for Version History.
 *
 * - 320px wide (w-80), slides in from the right
 * - Free users see an upgrade prompt instead of the version list
 * - Paid users see a paginated list; clicking a version previews it
 */
export function VersionPanel({
  resumeId,
  currentTemplateId,
  isPaid,
  onClose,
  onPreview,
  onRestore,
  previewingVersion,
}: VersionPanelProps) {
  const [versions, setVersions] = React.useState<VersionEntryType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!isPaid) return;

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const results = await listVersions(resumeId, PAGE_SIZE);
        if (cancelled) return;
        setVersions(results);
        setHasMore(results.length === PAGE_SIZE);
      } catch (err) {
        console.error("VersionPanel: failed to load versions", err);
        if (!cancelled) setError("Failed to load versions.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [resumeId, isPaid]);

  // ---------------------------------------------------------------------------
  // Load more (pagination)
  // ---------------------------------------------------------------------------
  async function handleLoadMore() {
    const lastVersion = versions[versions.length - 1];
    if (!lastVersion) return;

    setIsLoading(true);
    setError(null);
    try {
      const more = await listVersions(resumeId, PAGE_SIZE, lastVersion.createdAt);
      setVersions((prev) => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch (err) {
      console.error("VersionPanel: failed to load more versions", err);
      setError("Failed to load more versions.");
    } finally {
      setIsLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Restore
  // ---------------------------------------------------------------------------
  async function handleRestore() {
    if (!previewingVersion) return;
    setIsRestoring(true);
    try {
      await onRestore(previewingVersion.id);
    } finally {
      setIsRestoring(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <aside
      className="fixed top-0 right-0 h-full w-80 bg-card border-l border-border shadow-xl z-40 flex flex-col"
      role="complementary"
      aria-label="Version History"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Version History</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors rounded p-1 -mr-1"
          aria-label="Close version history"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!isPaid ? (
          /* Free tier upsell */
          <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Upgrade to Pro for version history
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Keep up to 50 snapshots of your resume and restore any previous
                version instantly.
              </p>
            </div>
            <Button
              variant="primary"
              className="text-xs w-full"
              onClick={() => (window.location.href = "/settings")}
            >
              Upgrade to Pro
            </Button>
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              className="mt-2 text-xs text-primary hover:underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : isLoading && versions.length === 0 ? (
          /* Initial skeleton */
          <div className="px-4 py-3 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-2 animate-pulse">
                <span className="mt-1 block w-2 h-2 rounded-full bg-muted flex-shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No versions saved yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Versions are created automatically when you save.
            </p>
          </div>
        ) : (
          <>
            <ul role="list" className="divide-y divide-border">
              {versions.map((v) => (
                <li key={v.id}>
                  <VersionEntry
                    version={v}
                    isSelected={previewingVersion?.id === v.id}
                    currentTemplateId={currentTemplateId}
                    onClick={() =>
                      onPreview(previewingVersion?.id === v.id ? null : v)
                    }
                  />
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="px-4 py-3">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="w-full text-xs text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed py-1"
                >
                  {isLoading ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview banner — shown when a version is being previewed */}
      {previewingVersion && (
        <div className="flex-shrink-0 border-t border-border bg-warning/10 px-4 py-3 space-y-2">
          <p className="text-xs text-warning font-medium">
            Viewing version from{" "}
            {previewingVersion.createdAt?.toDate?.().toLocaleString() ??
              "unknown time"}
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              className="text-xs flex-1"
              onClick={handleRestore}
              disabled={isRestoring}
            >
              {isRestoring ? "Restoring..." : "Restore this version"}
            </Button>
            <Button
              variant="ghost"
              className="text-xs flex-1"
              onClick={() => onPreview(null)}
            >
              Back to current
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
