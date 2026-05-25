import * as React from "react";
import { renderMarkdown } from "../../lib/markdown";
import { useDebounce } from "../../hooks/useDebounce";
import { PaperContainer } from "./PaperContainer";
import { Skeleton } from "../ui/Skeleton";

interface ResumePreviewProps {
  markdown: string;
  templateId: string;
  paperSize: "us-letter" | "a4";
}

const RENDER_DEBOUNCE_MS = 150;

/**
 * Live preview panel: debounces markdown rendering and displays the result
 * inside a paper-sized container centered on a gray background.
 */
export function ResumePreview({ markdown, templateId, paperSize }: ResumePreviewProps) {
  const [htmlContent, setHtmlContent] = React.useState("");
  const [isRendering, setIsRendering] = React.useState(false);

  // Debounce the markdown string to avoid expensive remark pipeline on every keystroke
  const debouncedMarkdown = useDebounce(markdown, RENDER_DEBOUNCE_MS);

  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      setIsRendering(true);
      try {
        const html = await renderMarkdown(debouncedMarkdown);
        if (!cancelled) {
          setHtmlContent(html);
        }
      } catch (err) {
        console.error("ResumePreview: render error", err);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    }

    render();
    return () => { cancelled = true; };
  }, [debouncedMarkdown]);

  return (
    <div
      className="h-full w-full bg-gray-50 overflow-y-auto"
      role="region"
      aria-label="Resume preview"
      aria-live="polite"
    >
      {isRendering && !htmlContent ? (
        // First-load skeleton
        <div className="flex justify-center pt-8 px-4">
          <div className="flex flex-col gap-3" style={{ width: 600 }}>
            <Skeleton height={32} className="w-1/2 mx-auto" />
            <Skeleton height={16} className="w-3/4" />
            <Skeleton height={16} className="w-2/3" />
            <Skeleton height={16} className="w-4/5" />
            <Skeleton height={16} className="w-1/2" />
            <Skeleton height={16} className="w-3/4 mt-4" />
            <Skeleton height={16} className="w-2/3" />
            <Skeleton height={16} className="w-4/5" />
          </div>
        </div>
      ) : (
        <div className="py-8">
          <PaperContainer
            paperSize={paperSize}
            templateId={templateId}
            htmlContent={htmlContent}
          />
        </div>
      )}
    </div>
  );
}
