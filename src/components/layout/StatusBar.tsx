import type { SaveStatus } from "../../hooks/useResume";

interface StatusBarProps {
  saveStatus: SaveStatus;
  paperSize: "us-letter" | "a4";
  onTogglePaperSize: () => void;
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
};

/**
 * Thin bottom status bar.
 * Left: save status indicator
 * Right: paper size toggle
 */
export function StatusBar({ saveStatus, paperSize, onTogglePaperSize }: StatusBarProps) {
  const { label, className } = SAVE_STATUS_CONFIG[saveStatus];

  return (
    <footer
      className={[
        "h-8 flex items-center justify-between px-4",
        "bg-gray-50 border-t border-gray-200",
        "text-xs text-gray-500",
        "flex-shrink-0",
      ].join(" ")}
    >
      {/* Save status */}
      <span className={className} aria-live="polite" aria-atomic="true">
        {label}
      </span>

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
