import * as React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useResume } from "../hooks/useResume";
import { useToast } from "../hooks/useToast";
import { AppNav } from "../components/layout/AppNav";
import { StatusBar } from "../components/layout/StatusBar";
import { EditorLayout } from "../components/editor/EditorLayout";
import { Skeleton } from "../components/ui/Skeleton";
import { TemplatePicker } from "../components/templates/TemplatePicker";
import { VersionPanel } from "../components/versions/VersionPanel";
import { createSnapshot } from "../services/versions";
import type { VersionEntry } from "../services/versions";

/**
 * Main editor page.
 *
 * Routes:
 *   /editor            — loads the user's default resume
 *   /editor/:resumeId  — loads a specific resume
 */
// How long (ms) a user must be idle before the next auto-save creates a snapshot
const IDLE_SNAPSHOT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function Editor() {
  const { resumeId: routeResumeId } = useParams<{ resumeId?: string }>();
  const { user, firebaseUser } = useAuth();
  const toast = useToast();

  const {
    isLoading,
    resumeId: resolvedResumeId,
    markdown,
    setMarkdown,
    title,
    setTitle,
    templateId,
    setTemplateId,
    paperSize,
    setPaperSize,
    saveStatus,
    forceSave,
    setOverflow,
    isOnline,
    isLocalBackupActive,
    showRecoveryBanner,
    acceptRecovery,
    dismissRecovery,
  } = useResume(routeResumeId);

  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  // ---------------------------------------------------------------------------
  // Version history state
  // ---------------------------------------------------------------------------
  const [isVersionPanelOpen, setIsVersionPanelOpen] = React.useState(false);
  const [previewingVersion, setPreviewingVersion] =
    React.useState<VersionEntry | null>(null);

  // Track when a snapshot was last created to implement idle-based snapshotting
  const lastSnapshotAtRef = React.useRef<number | null>(null);
  // Track last-changed timestamp for idle detection
  const lastChangedAtRef = React.useRef<number | null>(null);
  // Track whether a snapshot is needed on next auto-save (due to idle)
  const needsSnapshotRef = React.useRef(false);
  // Track whether this is the first auto-save of the session
  const isFirstAutoSaveRef = React.useRef(true);

  const isPaid =
    user?.subscription?.status === "active" ||
    user?.subscription?.status === "past_due";

  // ---------------------------------------------------------------------------
  // Snapshot helper: fire-and-forget, uses current editor state
  // ---------------------------------------------------------------------------
  const takeSnapshot = React.useCallback(
    async (snapshotMarkdown: string, snapshotTemplateId: string) => {
      const id = resolvedResumeId;
      if (!id) return;
      try {
        await createSnapshot(id, snapshotMarkdown, snapshotTemplateId);
        lastSnapshotAtRef.current = Date.now();
        needsSnapshotRef.current = false;
      } catch (err) {
        console.error("Editor: snapshot failed", err);
      }
    },
    [resolvedResumeId]
  );

  // ---------------------------------------------------------------------------
  // Ctrl/Cmd+S at page level (catches events that bubble outside the textarea)
  // Creates a snapshot on every manual save.
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    async function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (ctrlOrCmd && e.key === "s") {
        e.preventDefault();
        await forceSave();
        // Snapshot on every manual Ctrl+S
        await takeSnapshot(markdown, templateId);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [forceSave, takeSnapshot, markdown, templateId]);

  // ---------------------------------------------------------------------------
  // Idle detection: mark needsSnapshot when content is unchanged for 5+ minutes
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (saveStatus === "unsaved") {
      lastChangedAtRef.current = Date.now();
    }
  }, [markdown, title, templateId, paperSize, saveStatus]);

  // Check idle threshold on a 30-second interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (lastChangedAtRef.current === null) return;
      const idleMs = Date.now() - lastChangedAtRef.current;
      if (idleMs >= IDLE_SNAPSHOT_THRESHOLD_MS) {
        needsSnapshotRef.current = true;
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-save side-effect: create snapshot when needed (idle or first session save)
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (saveStatus !== "saved") return;
    if (!resolvedResumeId) return;

    const shouldSnapshot = isFirstAutoSaveRef.current || needsSnapshotRef.current;
    if (shouldSnapshot) {
      isFirstAutoSaveRef.current = false;
      takeSnapshot(markdown, templateId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveStatus]);

  // ---------------------------------------------------------------------------
  // Paper size toggle
  // ---------------------------------------------------------------------------
  function handleTogglePaperSize() {
    setPaperSize(paperSize === "us-letter" ? "a4" : "us-letter");
  }

  // ---------------------------------------------------------------------------
  // Restore a version via the server-side API
  // ---------------------------------------------------------------------------
  async function handleRestoreVersion(versionId: string) {
    const id = resolvedResumeId;
    if (!id) return;

    try {
      const token = await firebaseUser?.getIdToken();
      if (!token) {
        toast.error("Authentication error. Please sign in again.");
        return;
      }

      const apiBase =
        import.meta.env.VITE_FUNCTIONS_URL ??
        `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/api`;

      const response = await fetch(
        `${apiBase}/api/resumes/${id}/versions/restore`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ versionId }),
        }
      );

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const message: string =
          (json as { error?: { message?: string } })?.error?.message ??
          "Failed to restore version. Please try again.";
        toast.error(message);
        return;
      }

      // Close preview and panel, then reload to pull restored content
      setPreviewingVersion(null);
      setIsVersionPanelOpen(false);
      toast.success("Version restored");

      // Reload the page so the editor pulls the restored resume data
      window.location.reload();
    } catch {
      toast.error("Failed to restore version. Please try again.");
    }
  }

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
        {/* Nav skeleton */}
        <div className="h-14 flex items-center gap-4 px-4 border-b border-gray-200 bg-white flex-shrink-0">
          <Skeleton width={80} height={20} />
          <div className="flex-1 flex justify-center">
            <Skeleton width={180} height={18} />
          </div>
          <div className="flex gap-2">
            <Skeleton width={90} height={36} />
            <Skeleton width={100} height={36} />
          </div>
        </div>

        {/* Editor skeleton — two panels */}
        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 p-6 flex flex-col gap-3 border-r border-gray-200">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} variant="text" width={`${60 + (i % 5) * 8}%`} />
            ))}
          </div>
          <div className="flex-1 flex justify-center items-start pt-8 px-4 bg-gray-50">
            <div className="flex flex-col gap-4" style={{ width: 500 }}>
              <Skeleton height={32} className="w-1/2 mx-auto" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} variant="text" width={`${50 + (i % 4) * 10}%`} />
              ))}
            </div>
          </div>
        </div>

        {/* Status bar skeleton */}
        <div className="h-8 bg-gray-50 border-t border-gray-200" />
      </div>
    );
  }

  // When previewing a version, show its content in the preview pane
  const previewMarkdown = previewingVersion?.markdown ?? markdown;
  const previewTemplateId = previewingVersion?.templateId ?? templateId;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <AppNav
        title={title}
        onTitleChange={setTitle}
        templateId={templateId}
        username={user?.username}
        onOpenTemplatePicker={() => setIsPickerOpen(true)}
        onOpenVersionHistory={() => setIsVersionPanelOpen(true)}
        resumeId={resolvedResumeId ?? undefined}
        paperSize={paperSize}
      />

      <main className="flex-1 overflow-hidden">
        <EditorLayout
          markdown={previewMarkdown}
          onMarkdownChange={previewingVersion ? () => {} : setMarkdown}
          onForceSave={forceSave}
          templateId={previewTemplateId}
          paperSize={paperSize}
          onOverflowChange={setOverflow}
        />
      </main>

      {showRecoveryBanner && (
        <div className="flex items-center justify-between gap-4 px-4 py-2 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex-shrink-0">
          <span>A newer local backup was found. Restore it?</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={acceptRecovery}
              className="font-semibold underline underline-offset-2 hover:text-amber-900"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={dismissRecovery}
              className="hover:text-amber-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <StatusBar
        saveStatus={saveStatus}
        paperSize={paperSize}
        onTogglePaperSize={handleTogglePaperSize}
        isOnline={isOnline}
        isLocalBackupActive={isLocalBackupActive}
      />

      <TemplatePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onApply={async (newId) => {
          // Snapshot current state before switching template
          await takeSnapshot(markdown, templateId);
          setTemplateId(newId);
          setIsPickerOpen(false);
        }}
        currentTemplateId={templateId}
        markdown={markdown}
        paperSize={paperSize}
        isPaid={isPaid ?? false}
      />

      {isVersionPanelOpen && resolvedResumeId && (
        <VersionPanel
          resumeId={resolvedResumeId}
          currentTemplateId={templateId}
          isPaid={isPaid ?? false}
          onClose={() => {
            setIsVersionPanelOpen(false);
            setPreviewingVersion(null);
          }}
          onPreview={setPreviewingVersion}
          onRestore={handleRestoreVersion}
          previewingVersion={previewingVersion}
        />
      )}
    </div>
  );
}
