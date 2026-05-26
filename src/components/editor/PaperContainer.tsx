import * as React from "react";
import { stylesToCssVars, stylesToDataAttrs } from "../../lib/styleUtils";
import type { ResumeStyles } from "../../types/resume";

// Paper dimensions at 96 DPI
const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

interface PaperContainerProps {
  styles: ResumeStyles;
  htmlContent: string;
  /**
   * Content-level scale factor for overflow shrinking (Task 8).
   * Applied to the content wrapper inside the paper, not to the paper itself.
   * Defaults to 1.0 (no scaling).
   */
  contentScaleFactor?: number;
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
  styles,
  htmlContent,
  contentScaleFactor = 1.0,
}: PaperContainerProps) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [panelScale, setPanelScale] = React.useState(1);

  const { width: paperWidth, height: paperHeight } = PAPER_DIMENSIONS[styles.pageSize];
  const pageMarginPx = Math.round(styles.pageMargin * 96);
  const cssVars = stylesToCssVars(styles);
  const dataAttrs = stylesToDataAttrs(styles);

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

  // panelScale: shrinks the entire paper to fit the panel width
  // contentScaleFactor: shrinks content inside the paper (overflow scaling)
  const scaledHeight = paperHeight * panelScale;

  return (
    // Outer wrapper — fills available space, used by ResizeObserver
    <div ref={wrapperRef} className="w-full flex justify-center">
      {/* Height placeholder so the parent scroll area accounts for the scaled paper */}
      <div style={{ height: scaledHeight, width: paperWidth * panelScale }}>
        <div
          style={{
            width: paperWidth,
            height: paperHeight,
            transformOrigin: "top left",
            transform: `scale(${panelScale})`,
          }}
          className="bg-white shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Inner padding derived from styles.pageMargin */}
          <div style={{ padding: pageMarginPx }} {...dataAttrs}>
            {/*
              Content scale wrapper — applies overflow shrinking (contentScaleFactor).
              Width is expanded to 100%/factor so scaled content still fills paper width.
              transform-origin: top left ensures content shrinks from the top corner,
              not the center.
            */}
            <div
              style={
                contentScaleFactor < 1
                  ? {
                      transform: `scale(${contentScaleFactor})`,
                      transformOrigin: "top left",
                      width: `${100 / contentScaleFactor}%`,
                    }
                  : undefined
              }
            >
              <div
                className="resume-content"
                style={cssVars as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
