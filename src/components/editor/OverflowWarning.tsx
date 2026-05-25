import { X } from "lucide-react";

interface OverflowWarningProps {
  scaleFactor: number;
  onDismiss: () => void;
}

/**
 * Warning bar displayed above the preview panel when content exceeds one page.
 *
 * States:
 *   scaleFactor === 1.0          → hidden
 *   0.75 < scaleFactor < 1.0     → amber/warning: "Auto-scaled to X%"
 *   scaleFactor === 0.75         → red/error: "Maximum scaling reached"
 *
 * Animates in from the top (duration-200) when overflow is detected.
 * Disappears immediately when content fits again (no exit animation —
 * instant positive feedback per spec).
 */
export function OverflowWarning({ scaleFactor, onDismiss }: OverflowWarningProps) {
  const isVisible = scaleFactor < 1.0;
  const isMaxScaled = scaleFactor <= 0.75;
  const scalePercent = Math.round(scaleFactor * 100);

  // Transition only on enter — the component mounts/unmounts handled by parent
  // We keep the element in DOM but animate visibility via class
  if (!isVisible) return null;

  const barClasses = isMaxScaled
    ? "bg-red-50 border-red-200 text-red-800"
    : "bg-amber-50 border-amber-200 text-amber-800";

  const iconClasses = isMaxScaled
    ? "text-red-400 hover:text-red-600"
    : "text-amber-400 hover:text-amber-600";

  return (
    <div
      role="alert"
      className={[
        "flex items-center justify-between border-b py-2 px-4 text-sm font-medium",
        "animate-in slide-in-from-top duration-200",
        barClasses,
      ].join(" ")}
    >
      <span>
        {isMaxScaled ? (
          "Maximum scaling reached. Trim content to fit one page."
        ) : (
          <>
            Content exceeds one page. Auto-scaled to {scalePercent}%.{" "}
            <span className="font-normal opacity-75">Trim content to reduce scaling.</span>
          </>
        )}
      </span>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss overflow warning"
        className={[
          "ml-3 flex-shrink-0 p-0.5 rounded transition-colors",
          iconClasses,
        ].join(" ")}
      >
        <X className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}
