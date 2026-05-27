import * as React from "react";
import { useNavigate } from "react-router-dom";
import { writeBatch, doc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { Button } from "../ui/Button";
import { ConfirmModal } from "../ui/ConfirmModal";
import { OverflowMenu } from "../ui/OverflowMenu";
import { renderMarkdown } from "../../lib/markdown";
import { updateResume, createResume, deleteResume } from "../../services/resumes";
import { useToast } from "../../hooks/useToast";
import { stylesToCssVars, stylesToDataAttrs } from "../../lib/styleUtils";
import { deriveStyles } from "../../constants/presets";
import type { Resume, ResumeStyles } from "../../types/resume";
import type { Analytics } from "../../types/analytics";

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------

function relativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`;
}

// ---------------------------------------------------------------------------
// Paper dimensions at 96 DPI (same as PaperContainer)
// ---------------------------------------------------------------------------

const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

// Thumbnail target width in px (the visible card width minus padding ~260px)
const THUMBNAIL_WIDTH = 260;

// ---------------------------------------------------------------------------
// Thumbnail component
// ---------------------------------------------------------------------------

interface ThumbnailProps {
  markdown: string;
  styles: ResumeStyles;
}

function ResumeThumbnail({ markdown, styles }: ThumbnailProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [htmlContent, setHtmlContent] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;
    renderMarkdown(markdown).then((html) => {
      if (!cancelled) setHtmlContent(html);
    });
    return () => {
      cancelled = true;
    };
  }, [markdown]);

  const { width: paperWidth, height: paperHeight } =
    PAPER_DIMENSIONS[styles.pageSize];
  const scale = THUMBNAIL_WIDTH / paperWidth;
  const scaledHeight = Math.round(paperHeight * scale);
  const pageMarginPx = Math.round(styles.pageMargin * 96);

  return (
    <div
      style={{ width: THUMBNAIL_WIDTH, height: scaledHeight, overflow: "hidden" }}
      className="bg-muted"
      aria-hidden="true"
    >
      {/* Hidden full-size paper, scaled down */}
      <div
        ref={containerRef}
        style={{
          width: paperWidth,
          height: paperHeight,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          pointerEvents: "none",
          userSelect: "none",
        }}
        className="bg-card"
      >
        <div
          style={{ padding: pageMarginPx }}
          {...stylesToDataAttrs(styles)}
        >
          <div
            className="resume-content"
            style={stylesToCssVars(styles) as React.CSSProperties}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResumeCard
// ---------------------------------------------------------------------------

interface ResumeCardProps {
  resume: Resume;
  analytics: Analytics | null;
  allResumes: Resume[];
  onResumesChange: () => void;
}

export function ResumeCard({
  resume,
  analytics,
  allResumes,
  onResumesChange,
}: ResumeCardProps) {
  const navigate = useNavigate();
  const toast = useToast();

  const resolvedStyles: ResumeStyles =
    resume.styles ?? deriveStyles(resume.templateId, resume.paperSize ?? "us-letter");

  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isRenaming, setIsRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState(resume.title);
  const [isSavingRename, setIsSavingRename] = React.useState(false);
  const renameInputRef = React.useRef<HTMLInputElement>(null);

  // Sync rename value when resume title changes externally
  React.useEffect(() => {
    if (!isRenaming) setRenameValue(resume.title);
  }, [resume.title, isRenaming]);

  function startRename() {
    setRenameValue(resume.title);
    setIsRenaming(true);
    requestAnimationFrame(() => renameInputRef.current?.select());
  }

  async function commitRename() {
    const trimmed = renameValue.trim() || resume.title;
    setIsRenaming(false);
    if (trimmed === resume.title) return;
    setIsSavingRename(true);
    try {
      await updateResume(resume.id, { title: trimmed });
      onResumesChange();
    } catch {
      toast.error("Failed to rename resume.");
    } finally {
      setIsSavingRename(false);
    }
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") renameInputRef.current?.blur();
    if (e.key === "Escape") {
      setRenameValue(resume.title);
      setIsRenaming(false);
    }
  }

  async function handleSetDefault() {
    try {
      const batch = writeBatch(db);
      // Clear existing default(s)
      for (const r of allResumes) {
        if (r.isDefault && r.id !== resume.id) {
          batch.update(doc(db, "resumes", r.id), { isDefault: false });
        }
      }
      batch.update(doc(db, "resumes", resume.id), { isDefault: true });
      await batch.commit();
      onResumesChange();
      toast.success("Default resume updated.");
    } catch {
      toast.error("Failed to set default resume.");
    }
  }

  async function handleDuplicate() {
    try {
      const newId = await createResume({
        userId: resume.userId,
        title: `${resume.title} (copy)`,
        markdown: resume.markdown,
        templateId: resume.templateId,
        isDefault: false,
        paperSize: resume.paperSize,
        overflow: resume.overflow,
        styles: resolvedStyles,
        showQrCode: resume.showQrCode ?? false,
        qrCodeUrl: resume.qrCodeUrl ?? null,
      });
      onResumesChange();
      toast.success("Resume duplicated.");
      navigate(`/editor/${newId}`);
    } catch {
      toast.error("Failed to duplicate resume.");
    }
  }

  function handleDeleteClick() {
    if (allResumes.length <= 1) {
      toast.error("You cannot delete your only resume.");
      return;
    }
    setShowDeleteConfirm(true);
  }

  async function handleDeleteConfirm() {
    setShowDeleteConfirm(false);
    try {
      await deleteResume(resume.id);
      onResumesChange();
      toast.success("Resume deleted.");
    } catch {
      toast.error("Failed to delete resume.");
    }
  }

  const updatedDate = resume.updatedAt?.toDate?.() ?? new Date();
  const profileViews = analytics?.profileViews ?? 0;
  const pdfDownloads = analytics?.pdfDownloads ?? 0;

  const overflowItems = [
    ...(!resume.isDefault
      ? [{ label: "Set as default", onClick: handleSetDefault }]
      : []),
    { label: "Duplicate", onClick: handleDuplicate },
    { label: "Rename", onClick: startRename },
    {
      label: "Delete",
      onClick: handleDeleteClick,
      variant: "danger" as const,
    },
  ];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail — hidden on mobile */}
      <div className="hidden sm:block w-full overflow-hidden bg-muted flex-shrink-0">
        <ResumeThumbnail
          markdown={resume.markdown}
          styles={resolvedStyles}
        />
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        {/* Title */}
        {isRenaming ? (
          <input
            ref={renameInputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            className="text-base font-semibold text-foreground border-b border-primary outline-none bg-transparent w-full pb-0.5"
            aria-label="Rename resume"
          />
        ) : (
          <p
            className="text-base font-semibold text-foreground truncate"
            title={resume.title}
          >
            {isSavingRename ? renameValue : resume.title}
          </p>
        )}

        {/* Default badge */}
        {resume.isDefault && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="text-yellow-500">★</span>
            Default
          </p>
        )}

        {/* Analytics */}
        <p className="text-xs text-muted-foreground">
          {profileViews} view{profileViews !== 1 ? "s" : ""} &middot;{" "}
          {pdfDownloads} download{pdfDownloads !== 1 ? "s" : ""}
        </p>

        {/* Updated */}
        <p className="text-xs text-muted-foreground">
          Updated {relativeTime(updatedDate)}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Button
            variant="secondary"
            className="flex-1 text-xs"
            onClick={() => navigate(`/editor/${resume.id}`)}
          >
            Edit
          </Button>
          <OverflowMenu items={overflowItems} triggerLabel="Resume actions" />
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete resume?"
        message={`"${resume.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
