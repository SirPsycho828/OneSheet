import * as React from "react";
import { Code, Eye, Palette, Sparkles } from "lucide-react";
import { MarkdownInput } from "./MarkdownInput";
import { ResumePreview } from "./ResumePreview";
import { DesignPanel } from "./DesignPanel";
import { GuidanceTip } from "../ux/GuidanceTip";
import type { OverflowState } from "../../hooks/useOverflow";
import type { ResumeStyles } from "../../types/resume";

interface EditorLayoutProps {
  markdown: string;
  onMarkdownChange: (value: string) => void;
  onForceSave: () => void;
  styles: ResumeStyles;
  onStylesChange: (styles: ResumeStyles) => void;
  /** Called after each overflow measurement in the preview panel. */
  onOverflowChange?: (state: OverflowState) => void;
  /** Opens the AI tools panel (rendered in Editor.tsx). */
  onOpenAI?: () => void;
  showQrCode?: boolean;
  onShowQrCodeChange?: (show: boolean) => void;
  qrCodeUrl?: string | null;
  onQrCodeUrlChange?: (url: string | null) => void;
  isPaid?: boolean;
  /** Pre-computed QR code URL (includes fallback to profile URL). */
  effectiveQrUrl?: string;
}

type LeftMode = "source" | "design";
type MobileTab = "edit" | "design" | "preview";

const MIN_PANEL_WIDTH = 320;

/**
 * Desktop (>= 1024px): side-by-side resizable split panel with Source/Design toggle.
 * Mobile (< 1024px):   tab switcher with single visible panel.
 */
export function EditorLayout({
  markdown,
  onMarkdownChange,
  onForceSave,
  styles,
  onStylesChange,
  onOverflowChange,
  onOpenAI,
  showQrCode,
  onShowQrCodeChange,
  qrCodeUrl,
  onQrCodeUrlChange,
  isPaid,
  effectiveQrUrl,
}: EditorLayoutProps) {
  // ---------------------------------------------------------------------------
  // Desktop split state
  // ---------------------------------------------------------------------------
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [splitPercent, setSplitPercent] = React.useState(50);
  const isDraggingRef = React.useRef(false);
  const dragStartXRef = React.useRef(0);
  const dragStartSplitRef = React.useRef(50);

  // Left panel mode: Source (markdown) or Design (style controls)
  const [leftMode, setLeftMode] = React.useState<LeftMode>("source");

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

  // Show first-run guidance when editor has minimal content
  const isBlankResume = markdown.trim().length < 30;

  // ---------------------------------------------------------------------------
  // Mobile tab state
  // ---------------------------------------------------------------------------
  const [mobileTab, setMobileTab] = React.useState<MobileTab>("edit");

  // ---------------------------------------------------------------------------
  // Tab styling helper
  // ---------------------------------------------------------------------------
  function tabClass(active: boolean) {
    return [
      "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
      active
        ? "border-b-2 border-primary text-primary"
        : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
    ].join(" ");
  }

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Desktop layout — hidden below lg                                    */}
      {/* ------------------------------------------------------------------ */}
      <div
        ref={containerRef}
        className="hidden lg:flex h-full w-full overflow-hidden"
      >
        {/* Left panel: Source/Design toggle + content */}
        <div
          className="h-full overflow-hidden border-r border-border flex flex-col"
          style={{ width: `${splitPercent}%`, flexShrink: 0 }}
        >
          {/* Tab bar */}
          <div className="flex border-b border-border bg-card flex-shrink-0">
            <button
              type="button"
              onClick={() => setLeftMode("source")}
              className={tabClass(leftMode === "source")}
            >
              <Code className="w-4 h-4" strokeWidth={1.5} />
              Source
            </button>
            <button
              type="button"
              onClick={() => setLeftMode("design")}
              className={tabClass(leftMode === "design")}
            >
              <Palette className="w-4 h-4" strokeWidth={1.5} />
              Design
            </button>
            {onOpenAI && (
              <button
                type="button"
                onClick={onOpenAI}
                className={tabClass(false)}
              >
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
                AI
              </button>
            )}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {leftMode === "source" && isBlankResume && (
              <div className="px-3 pt-3 flex-shrink-0">
                <GuidanceTip id="editor-first-run">
                  Write your resume in Markdown. Use <strong># Heading</strong> for sections,{" "}
                  <strong>**bold**</strong> for emphasis, and <strong>- bullets</strong> for
                  experience items. Start with your name, then add Experience, Skills, and
                  Education sections.
                </GuidanceTip>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
            {leftMode === "source" ? (
              <MarkdownInput
                value={markdown}
                onChange={onMarkdownChange}
                onForceSave={onForceSave}
              />
            ) : (
              <DesignPanel
                styles={styles}
                onStylesChange={onStylesChange}
                showQrCode={showQrCode}
                onShowQrCodeChange={onShowQrCodeChange}
                qrCodeUrl={qrCodeUrl}
                onQrCodeUrlChange={onQrCodeUrlChange}
                isPaid={isPaid}
              />
            )}
            </div>
          </div>
        </div>

        {/* Drag handle */}
        <div
          className="relative z-10 flex-shrink-0 w-1 bg-border hover:bg-primary transition-colors duration-150 cursor-col-resize select-none"
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
            styles={styles}
            onOverflowChange={onOverflowChange}
            qrCodeUrl={effectiveQrUrl}
          />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile layout — shown below lg                                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex lg:hidden flex-col h-full w-full">
        {/* Tab switcher */}
        <div className="flex border-b border-border bg-card flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab("edit")}
            className={tabClass(mobileTab === "edit")}
          >
            <Code className="w-4 h-4" strokeWidth={1.5} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("design")}
            className={tabClass(mobileTab === "design")}
          >
            <Palette className="w-4 h-4" strokeWidth={1.5} />
            Design
          </button>
          <button
            type="button"
            onClick={() => {
              if (mobileTab === "edit") onForceSave();
              setMobileTab("preview");
            }}
            className={tabClass(mobileTab === "preview")}
          >
            <Eye className="w-4 h-4" strokeWidth={1.5} />
            Preview
          </button>
          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className={tabClass(false)}
            >
              <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              AI
            </button>
          )}
        </div>

        {/* Active panel */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {mobileTab === "edit" && isBlankResume && (
            <div className="px-3 pt-3 flex-shrink-0">
              <GuidanceTip id="editor-first-run">
                Write your resume in Markdown. Use <strong># Heading</strong> for sections,{" "}
                <strong>**bold**</strong> for emphasis, and <strong>- bullets</strong> for
                experience items.
              </GuidanceTip>
            </div>
          )}
          <div className="flex-1 overflow-hidden">
          {mobileTab === "edit" ? (
            <MarkdownInput
              value={markdown}
              onChange={onMarkdownChange}
              onForceSave={onForceSave}
            />
          ) : mobileTab === "design" ? (
            <DesignPanel styles={styles} onStylesChange={onStylesChange} />
          ) : (
            <ResumePreview
              markdown={markdown}
              styles={styles}
              onOverflowChange={onOverflowChange}
              qrCodeUrl={effectiveQrUrl}
            />
          )}
          </div>
        </div>
      </div>
    </>
  );
}
