import * as React from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useResume } from "../hooks/useResume";
import { AppNav } from "../components/layout/AppNav";
import { StatusBar } from "../components/layout/StatusBar";
import { EditorLayout } from "../components/editor/EditorLayout";
import { Skeleton } from "../components/ui/Skeleton";
import { TemplatePicker } from "../components/templates/TemplatePicker";

/**
 * Main editor page.
 *
 * Routes:
 *   /editor            — loads the user's default resume
 *   /editor/:resumeId  — loads a specific resume
 */
export function Editor() {
  const { resumeId } = useParams<{ resumeId?: string }>();
  const { user } = useAuth();

  const {
    isLoading,
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
  } = useResume(resumeId);

  const [isPickerOpen, setIsPickerOpen] = React.useState(false);

  const isPaid =
    user?.subscription?.status === "active" ||
    user?.subscription?.status === "past_due";

  // ---------------------------------------------------------------------------
  // Ctrl/Cmd+S at page level (catches events that bubble outside the textarea)
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (ctrlOrCmd && e.key === "s") {
        e.preventDefault();
        forceSave();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [forceSave]);

  // ---------------------------------------------------------------------------
  // Paper size toggle
  // ---------------------------------------------------------------------------
  function handleTogglePaperSize() {
    setPaperSize(paperSize === "us-letter" ? "a4" : "us-letter");
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

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <AppNav
        title={title}
        onTitleChange={setTitle}
        templateId={templateId}
        username={user?.username}
        onOpenTemplatePicker={() => setIsPickerOpen(true)}
        resumeId={resumeId}
        paperSize={paperSize}
      />

      <main className="flex-1 overflow-hidden">
        <EditorLayout
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          onForceSave={forceSave}
          templateId={templateId}
          paperSize={paperSize}
          onOverflowChange={setOverflow}
        />
      </main>

      <StatusBar
        saveStatus={saveStatus}
        paperSize={paperSize}
        onTogglePaperSize={handleTogglePaperSize}
      />

      <TemplatePicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onApply={(newId) => {
          setTemplateId(newId);
          setIsPickerOpen(false);
        }}
        currentTemplateId={templateId}
        markdown={markdown}
        paperSize={paperSize}
        isPaid={isPaid ?? false}
      />
    </div>
  );
}
