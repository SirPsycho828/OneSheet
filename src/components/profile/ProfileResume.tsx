import * as React from "react";
import { stylesToCssVars, stylesToDataAttrs } from "../../lib/styleUtils";
import { deriveStyles } from "../../constants/presets";
import type { ResumeStyles } from "../../types/resume";

// Paper dimensions at 96 DPI — must match PaperContainer and PDF lib
const PAPER_DIMENSIONS = {
  "us-letter": { width: 816, height: 1056 },
  a4: { width: 794, height: 1123 },
} as const;

interface ProfileResumeProps {
  resumeHtml: string;
  templateId: string;
  paperSize: "us-letter" | "a4";
  scaleFactor: number;
  styles?: ResumeStyles;
}

/**
 * Renders a resume in a paper-sized container for the public profile page.
 *
 * Desktop: fixed paper dimensions centered on the page with shadow.
 * Mobile (below md): full-width, no shadow, no fixed paper dimensions.
 */
export function ProfileResume({
  resumeHtml,
  templateId,
  paperSize,
  scaleFactor,
  styles,
}: ProfileResumeProps) {
  const resolvedStyles = styles ?? deriveStyles(templateId, paperSize ?? "us-letter");
  const { width: paperWidth, height: paperHeight } =
    PAPER_DIMENSIONS[resolvedStyles.pageSize];
  const pageMarginPx = Math.round(resolvedStyles.pageMargin * 96);
  const cssVars = stylesToCssVars(resolvedStyles);
  const dataAttrs = stylesToDataAttrs(resolvedStyles);

  return (
    <>
      {/* Desktop paper view */}
      <div
        className="hidden md:flex justify-center py-8"
        style={{ minHeight: paperHeight + 64 }}
      >
        <div
          className="bg-white shadow-lg overflow-hidden"
          style={{ width: paperWidth, height: paperHeight, flexShrink: 0 }}
        >
          <div style={{ padding: pageMarginPx }}>
            <div
              style={
                scaleFactor < 1
                  ? {
                      transform: `scale(${scaleFactor})`,
                      transformOrigin: "top left",
                      width: `${100 / scaleFactor}%`,
                    }
                  : undefined
              }
            >
              {/* data-preset on parent, .resume-content as child — required by CSS descendant selectors */}
              <div {...dataAttrs}>
                {/* SAFE: resumeHtml is sanitized server-side by rehype-sanitize */}
                <div
                  className="resume-content"
                  style={cssVars as React.CSSProperties}
                  dangerouslySetInnerHTML={{ __html: resumeHtml }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view — full-width, no paper simulation */}
      <div className="md:hidden px-4 py-6">
        <div className="bg-white">
          <div style={{ padding: pageMarginPx }}>
            {/* data-preset on parent, .resume-content as child — required by CSS descendant selectors */}
            <div {...dataAttrs}>
              {/* SAFE: resumeHtml is sanitized server-side by rehype-sanitize */}
              <div
                className="resume-content"
                style={cssVars as React.CSSProperties}
                dangerouslySetInnerHTML={{ __html: resumeHtml }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
