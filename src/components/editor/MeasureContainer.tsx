import * as React from "react";
import { stylesToCssVars, stylesToDataAttrs } from "../../lib/styleUtils";
import type { ResumeStyles } from "../../types/resume";

// Paper dimensions at 96 DPI — must match PaperContainer and useOverflow
const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

interface MeasureContainerProps {
  styles: ResumeStyles;
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
export function MeasureContainer({ styles, measureRef }: MeasureContainerProps) {
  const { width } = PAPER_DIMENSIONS[styles.pageSize];
  const pageMarginPx = Math.round(styles.pageMargin * 96);
  const contentWidth = width - pageMarginPx * 2;
  const cssVars = stylesToCssVars(styles);
  const dataAttrs = stylesToDataAttrs(styles);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: -9999,
        top: 0,
        width: contentWidth,
        visibility: "hidden",
        ...cssVars,
      } as React.CSSProperties}
      {...dataAttrs}
    >
      {/*
        Inner content div — matches the resume-content wrapper inside PaperContainer.
        The ref lands here so useOverflow can measure scrollHeight on this element.
      */}
      <div
        ref={measureRef}
        className="resume-content w-full h-full"
      />
    </div>
  );
}
