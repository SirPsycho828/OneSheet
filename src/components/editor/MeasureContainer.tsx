import * as React from "react";

// Paper dimensions at 96 DPI — must match PaperContainer and useOverflow
const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

const PAPER_PADDING = 48;

interface MeasureContainerProps {
  paperSize: "us-letter" | "a4";
  templateId: string;
  /** Ref that lands on the inner content div so useOverflow can read scrollHeight. */
  measureRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Off-screen measurement container used by useOverflow to detect content height
 * at true 1:1 scale (no CSS transform).
 *
 * - Fixed position off-screen so it participates in layout without affecting
 *   the visible page and without being affected by ancestor scroll offsets.
 * - visibility: hidden (NOT display: none) so scrollHeight is computable.
 * - Exact paper dimensions and same padding as the visible PaperContainer.
 * - NO CSS transform — measurement must be at 1:1 scale.
 */
export function MeasureContainer({ paperSize, templateId, measureRef }: MeasureContainerProps) {
  const { width, height } = PAPER_DIMENSIONS[paperSize];

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width,
        height,
        overflow: "hidden",
        visibility: "hidden",
        // Intentionally NO transform — must stay at 1:1 for accurate measurement
      }}
    >
      {/*
        Inner content div — matches the resume-content wrapper inside PaperContainer.
        The ref lands here so useOverflow can measure scrollHeight on this element.
      */}
      <div
        ref={measureRef}
        className="resume-content w-full h-full"
        data-template={templateId}
        style={{ padding: PAPER_PADDING }}
      />
    </div>
  );
}
