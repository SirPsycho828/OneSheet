
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
}: ProfileResumeProps) {
  const { width: paperWidth, height: paperHeight } =
    PAPER_DIMENSIONS[paperSize];

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
          <div style={{ padding: "48px" }}>
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
              <div
                className="resume-content"
                data-template={templateId}
                dangerouslySetInnerHTML={{ __html: resumeHtml }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile view — full-width, no paper simulation */}
      <div className="md:hidden px-4 py-6">
        <div className="bg-white">
          <div style={{ padding: "24px" }}>
            <div
              className="resume-content"
              data-template={templateId}
              dangerouslySetInnerHTML={{ __html: resumeHtml }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
