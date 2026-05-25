import * as React from "react";

// Paper dimensions at 96 DPI
const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

interface PaperContainerProps {
  paperSize: "us-letter" | "a4";
  templateId: string;
  htmlContent: string;
  /** Optional additional scale factor for overflow shrinking (Task 8). Defaults to 1.0. */
  scaleFactor?: number;
}

/**
 * Renders a paper-sized container holding the resume HTML.
 *
 * The paper is scaled via CSS `transform: scale()` so it always fits the
 * available parent width while preserving aspect ratio. A ResizeObserver on
 * the parent wrapper recalculates the scale factor whenever the panel resizes.
 *
 * Content is clipped at paper boundaries (`overflow: hidden`).
 */
export function PaperContainer({
  paperSize,
  templateId,
  htmlContent,
  scaleFactor = 1.0,
}: PaperContainerProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [panelScale, setPanelScale] = React.useState(1);

  const { width: paperWidth, height: paperHeight } = PAPER_DIMENSIONS[paperSize];

  // ---------------------------------------------------------------------------
  // ResizeObserver: scale paper to fit available panel width
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const availableWidth = entry.contentRect.width;
      if (availableWidth <= 0) return;

      // Leave 32px horizontal margin (16px each side)
      const targetWidth = availableWidth - 32;
      const scale = Math.min(1, targetWidth / paperWidth);
      setPanelScale(scale);
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [paperWidth]);

  const combinedScale = panelScale * scaleFactor;
  const scaledHeight = paperHeight * combinedScale;

  return (
    // Outer wrapper — fills available space, used by ResizeObserver
    <div ref={wrapperRef} className="w-full flex justify-center">
      {/* Height placeholder so the parent scroll area accounts for the scaled paper */}
      <div style={{ height: scaledHeight, width: paperWidth * combinedScale }}>
        <div
          style={{
            width: paperWidth,
            height: paperHeight,
            transformOrigin: "top left",
            transform: `scale(${combinedScale})`,
          }}
          className="bg-white shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Inner padding: 48px = ~0.5 inch at 96 DPI */}
          <div
            className="resume-content w-full h-full"
            data-template={templateId}
            style={{ padding: "48px" }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </div>
  );
}
