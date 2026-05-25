import type { VersionEntry as VersionEntryType } from "../../services/versions";
import { TEMPLATES } from "../../constants/templates";

interface VersionEntryProps {
  version: VersionEntryType;
  isSelected: boolean;
  currentTemplateId: string;
  onClick: () => void;
}

/**
 * Individual version list item displayed in the VersionPanel.
 *
 * - Dot indicator: filled when selected
 * - Timestamp: relative (e.g. "2 hours ago") with absolute on hover via title
 * - Template name shown only if it differs from the current template
 */
export function VersionEntry({
  version,
  isSelected,
  currentTemplateId,
  onClick,
}: VersionEntryProps) {
  const templateMeta = TEMPLATES.find((t) => t.id === version.templateId);
  const templateName = templateMeta?.name ?? version.templateId;
  const showTemplate = version.templateId !== currentTemplateId;

  const date = version.createdAt?.toDate?.() ?? new Date();
  const absoluteLabel = date.toLocaleString();
  const relativeLabel = getRelativeTime(date);

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full text-left flex items-start gap-3 px-4 py-3 transition-colors",
        "hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50",
        isSelected ? "bg-brand-50" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      title={absoluteLabel}
    >
      {/* Dot indicator */}
      <span className="mt-1 flex-shrink-0">
        {isSelected ? (
          <span className="block w-2 h-2 rounded-full bg-brand-500" />
        ) : (
          <span className="block w-2 h-2 rounded-full border border-gray-300" />
        )}
      </span>

      {/* Content */}
      <span className="flex flex-col min-w-0">
        <span
          className={[
            "text-sm truncate",
            isSelected ? "font-medium text-gray-900" : "text-gray-700",
          ].join(" ")}
        >
          {relativeLabel}
        </span>
        {showTemplate && (
          <span className="text-xs text-gray-400 truncate">{templateName}</span>
        )}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Relative time helper
// ---------------------------------------------------------------------------
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return `${diffMo} month${diffMo === 1 ? "" : "s"} ago`;
  const diffYr = Math.floor(diffMo / 12);
  return `${diffYr} year${diffYr === 1 ? "" : "s"} ago`;
}
