import * as React from "react";
import { Lock } from "lucide-react";

export interface TemplateCardProps {
  templateId: string;
  templateName: string;
  htmlContent: string;
  isSelected: boolean;
  isLocked: boolean;
  onClick: () => void;
}

/**
 * A single template card in the picker grid.
 *
 * Renders the resume HTML at full paper dimensions (816×1056px) then scales
 * it down to the card's natural width via CSS transform. This gives a
 * pixel-perfect miniature preview using the real template CSS.
 */
export function TemplateCard({
  templateId,
  templateName,
  htmlContent,
  isSelected,
  isLocked,
  onClick,
}: TemplateCardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0.25);

  // Recompute scale whenever the card renders or the window resizes.
  React.useLayoutEffect(() => {
    function measure() {
      if (containerRef.current) {
        const cardWidth = containerRef.current.offsetWidth;
        setScale(cardWidth / 816);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={[
        "flex flex-col gap-2 cursor-pointer group outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-lg",
      ].join(" ")}
      aria-label={`${templateName} template${isLocked ? " (Pro)" : ""}${isSelected ? ", currently selected" : ""}`}
    >
      {/* Paper card */}
      <div
        ref={containerRef}
        className={[
          "relative w-full overflow-hidden bg-white border border-gray-200 rounded-lg",
          "hover:shadow-md transition-shadow",
          // aspect ratio: US Letter 8.5×11 = 1:1.2941
          "aspect-[1/1.294]",
          isSelected
            ? "ring-2 ring-brand-500 ring-offset-2 border-transparent"
            : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {/* Full-size resume scaled down */}
        <div
          data-template={templateId}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: "816px",
            height: "1056px",
            padding: "48px",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div
            className="resume-content"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>

        {/* Lock overlay for Pro-only templates */}
        {isLocked && (
          <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1 rounded-lg">
            <Lock className="w-6 h-6 text-gray-500" strokeWidth={1.5} />
            <span className="text-xs font-medium text-gray-600">Pro</span>
          </div>
        )}

        {/* Pro badge in top-right corner */}
        {isLocked && (
          <div className="absolute top-2 right-2 bg-gray-900 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            PRO
          </div>
        )}
      </div>

      {/* Template name */}
      <p
        className={[
          "text-sm font-medium text-center",
          isSelected ? "text-brand-600" : "text-gray-700",
        ].join(" ")}
      >
        {templateName}
      </p>
    </div>
  );
}
