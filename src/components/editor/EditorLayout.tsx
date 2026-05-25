import * as React from "react";
import { Code, Eye } from "lucide-react";
import { MarkdownInput } from "./MarkdownInput";
import { ResumePreview } from "./ResumePreview";
import type { OverflowState } from "../../hooks/useOverflow";

interface EditorLayoutProps {
  markdown: string;
  onMarkdownChange: (value: string) => void;
  onForceSave: () => void;
  templateId: string;
  paperSize: "us-letter" | "a4";
  /** Called after each overflow measurement in the preview panel. */
  onOverflowChange?: (state: OverflowState) => void;
}

type MobileTab = "edit" | "preview";

const MIN_PANEL_WIDTH = 320;

/**
 * Desktop (>= 1024px): side-by-side resizable split panel.
 * Mobile (< 1024px):   tab switcher with single visible panel.
 */
export function EditorLayout({
  markdown,
  onMarkdownChange,
  onForceSave,
  templateId,
  paperSize,
  onOverflowChange,
}: EditorLayoutProps) {
  // ---------------------------------------------------------------------------
  // Desktop split state
  // ---------------------------------------------------------------------------
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [splitPercent, setSplitPercent] = React.useState(50);
  const isDraggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartSplitRef = React.useRef(50);

  function handleDragStart(e: React.MouseEvent) {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartSplitRef.current = splitPercent;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  React.useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!isDraggingRef.current || !containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const delta = e.clientX - dragStartXRef.current;
      const deltaPercent = (delta / containerWidth) * 100;
      let newPercent = dragStartSplitRef.current + deltaPercent;

      // Enforce minimum panel widths
      const minPercent = (MIN_PANEL_WIDTH / containerWidth) * 100;
      const maxPercent = 100 - minPercent;
      newPercent = Math.max(minPercent, Math.min(maxPercent, newPercent));

      setSplitPercent(newPercent);
    }

    function handleMouseUp() {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Mobile tab state
  // ---------------------------------------------------------------------------
  const [mobileTab, setMobileTab] = React.useState<MobileTab>("edit");

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout — hidden below lg                                    */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={containerRef}
        className="hidden lg:flex h-full w-full overflow-hidden"
      >
        {/* Left panel: Markdown input */}
        <div
          className="h-full overflow-hidden border-r border-gray-200"
          style={{ width: `${splitPercent}%`, flexShrink: 0 }}
        >
          <MarkdownInput
            value={markdown}
            onChange={onMarkdownChange}
            onForceSave={onForceSave}
          />
        </div>

        {/* Drag handle */}
        <div
          className="relative z-10 flex-shrink-0 w-1 bg-gray-200 hover:bg-brand-500 transition-colors duration-150 cursor-col-resize select-none"
          style={{ width: "4px" }}
          onMouseDown={handleDragStart}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panels"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") setSplitPercent((p) => Math.max(20, p - 2));
            if (e.key === "ArrowRight") setSplitPercent((p) => Math.min(80, p + 2));
          }}
        />

        {/* Right panel: Live preview */}
        <div className="h-full overflow-hidden flex-1 min-w-0">
          <ResumePreview
            markdown={markdown}
            templateId={templateId}
            paperSize={paperSize}
            onOverflowChange={onOverflowChange}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout — shown below lg                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex lg:hidden flex-col h-full w-full">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-200 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={[
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
              mobileTab === "edit"
                ? "border-b-2 border-brand-500 text-brand-500"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            <Code className="w-4 h-4" strokeWidth={1.5} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={[
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
              mobileTab === "preview"
                ? "border-b-2 border-brand-500 text-brand-500"
                : "border-b-2 border-transparent text-gray-500 hover:text-gray-700",
            ].join(" ")}
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
            Preview
          </button>
        </div>

        {/* Active panel */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === "edit" ? (
            <MarkdownInput
              value={markdown}
              onChange={onMarkdownChange}
              onForceSave={onForceSave}
            />
          ) : (
            <ResumePreview
              markdown={markdown}
              templateId={templateId}
              paperSize={paperSize}
              onOverflowChange={onOverflowChange}
            />
          )}
        </div>
      </div>
    </>
  );
}
