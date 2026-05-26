import * as React from "react";
import type { ResumeStyles } from "../types/resume";

// Paper dimensions at 96 DPI
const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

// Scale steps to try when overflowing
const SCALE_STEPS = [1.0, 0.95, 0.9, 0.85, 0.8, 0.75] as const;
const SCALE_FLOOR = 0.75;

export interface OverflowState {
  isOverflowing: boolean;
  scaleFactor: number;
}

/**
 * Detects overflow of rendered resume HTML against the paper dimensions
 * and calculates the appropriate scale factor to fit within one page.
 *
 * Uses an off-screen measurement div (via measureRef) that is rendered at
 * true paper size (no CSS transform) so measurement is always 1:1 scale.
 *
 * Math approach: measure contentHeight at scale 1.0, then calculate
 * scaleFactor = containerHeight / contentHeight, clamped and rounded
 * down to the nearest 0.05 step.
 */
export function useOverflow(
  htmlContent: string,
  styles: ResumeStyles,
): OverflowState & { measureRef: React.RefObject<HTMLDivElement | null> } {
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [scaleFactor, setScaleFactor] = React.useState(1.0);

  React.useEffect(() => {
    const container = measureRef.current;
    if (!container) return;

    // Inject content into the measurement container
    container.innerHTML = htmlContent;

    // Allow the browser to perform layout before measuring
    // (rAF ensures the DOM paint has occurred)
    const rafId = requestAnimationFrame(() => {
      if (!measureRef.current) return;

      const el = measureRef.current;
      const pageMarginPx = Math.round(styles.pageMargin * 96);
      const paperHeight = PAPER_DIMENSIONS[styles.pageSize].height;
      const containerHeight = paperHeight - pageMarginPx * 2;
      const contentHeight = el.scrollHeight;

      if (contentHeight <= containerHeight) {
        setIsOverflowing(false);
        setScaleFactor(1.0);
        return;
      }

      // Content overflows — find the best fitting scale factor
      // Exact ratio: how much we need to shrink
      const exactRatio = containerHeight / contentHeight;

      // Round DOWN to the nearest 0.05 step that is >= SCALE_FLOOR
      // Find the largest step in SCALE_STEPS that is <= exactRatio
      let chosen = SCALE_FLOOR;
      for (const step of SCALE_STEPS) {
        if (step <= exactRatio) {
          chosen = step;
          break;
        }
      }

      // If even 0.75 doesn't fit, use 0.75 anyway (maximum scaling)
      const finalScale = Math.max(SCALE_FLOOR, chosen);

      setIsOverflowing(true);
      setScaleFactor(finalScale);
    });

    return () => cancelAnimationFrame(rafId);
  }, [htmlContent, styles.pageSize, styles.pageMargin]);

  return { isOverflowing, scaleFactor, measureRef };
}
