import type { SaveStatus } from "../../hooks/useResume";

interface StatusBarProps {
  saveStatus: SaveStatus;
  paperSize: "us-letter" | "a4";
  onTogglePaperSize: () => void;
  isOnline?: boolean;
  isLocalBackupActive?: boolean;
}

const PAPER_SIZE_LABELS: Record<"us-letter" | "a4", string> = {
  "us-letter": "US Letter",
  a4: "A4",
};

const SAVE_STATUS_CONFIG: Record<
  SaveStatus,
  { label: string; className: string }
> = {
  saved: { label: "Saved", className: "text-success" },
  saving: { label: "Saving...", className: "text-gray-500" },
  unsaved: { label: "Unsaved", className: "text-warning" },
  error: { label: "Save failed", className: "text-error" },
  offline: { label: "Offline — changes stored locally", className: "text-warning" },
};

/**
 * Thin bottom status bar.
 * Left: save status indicator (+ offline badge, local backup notice)
 * Right: paper size toggle
 */
export function StatusBar({
  saveStatus,
  paperSize,
  onTogglePaperSize,
  isOnline = true,
  isLocalBackupActive = false,
}: StatusBarProps) {
  // Determine label and class — override when local backup is active
  let { label, className } = SAVE_STATUS_CONFIG[saveStatus];

  if (!isOnline && saveStatus !== "offline") {
    // Transition period: already offline but saveStatus hasn't flipped yet
    label = "Offline — changes stored locally";
    className = "text-warning";
  }

  if (isLocalBackupActive) {
    label = "Unable to save. Changes stored locally.";
    className = "text-error";
  }

  return (
    <footer
      className={[
        "h-8 flex items-center justify-between px-4",
        "bg-gray-50 border-t border-gray-200",
        "text-xs text-gray-500",
        "flex-shrink-0",
      ].join(" ")}
    >
      {/* Save status + optional offline badge */}
      <div className="flex items-center gap-2">
        {!isOnline && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
            Offline
          </span>
        )}
        <span className={className} aria-live="polite" aria-atomic="true">
          {label}
        </span>
      </div>

      {/* Paper size toggle */}
      <button
        type="button"
        onClick={onTogglePaperSize}
        className="hover:text-gray-700 transition-colors underline-offset-2 hover:underline"
        title="Click to toggle paper size"
      >
        {PAPER_SIZE_LABELS[paperSize]}
      </button>
    </footer>
  );
}
