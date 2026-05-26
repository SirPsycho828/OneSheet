import * as React from "react";
import { renderMarkdown } from "../../lib/markdown";
import { postProcessHtml } from "../../lib/postProcess";
import { useDebounce } from "../../hooks/useDebounce";
import { useOverflow } from "../../hooks/useOverflow";
import { PaperContainer } from "./PaperContainer";
import { MeasureContainer } from "./MeasureContainer";
import { OverflowWarning } from "./OverflowWarning";
import { Skeleton } from "../ui/Skeleton";
import type { OverflowState } from "../../hooks/useOverflow";
import type { ResumeStyles } from "../../types/resume";

interface ResumePreviewProps {
  markdown: string;
  styles: ResumeStyles;
  /** Called after each overflow measurement so the editor can persist state. */
  onOverflowChange?: (state: OverflowState) => void;
}

const RENDER_DEBOUNCE_MS = 150;

/**
 * Live preview panel: debounces markdown rendering and displays the result
 * inside a paper-sized container centered on a gray background.
 *
 * Integrates overflow detection (Task 8): renders an off-screen measurement
 * container, calculates scale factor, shows warning bar when scaling is active,
 * and passes scaleFactor down to PaperContainer.
 */
export function ResumePreview({
  markdown,
  styles,
  onOverflowChange,
}: ResumePreviewProps) {
  const [rawHtml, setRawHtml] = React.useState("");
  const [isRendering, setIsRendering] = React.useState(false);
  const [warningDismissed, setWarningDismissed] = React.useState(false);

  // Debounce the markdown string to avoid expensive remark pipeline on every keystroke
  const debouncedMarkdown = useDebounce(markdown, RENDER_DEBOUNCE_MS);

  // Render markdown -> raw HTML
  React.useEffect(() => {
    let cancelled = false;

    async function render() {
      setIsRendering(true);
      try {
        const html = await renderMarkdown(debouncedMarkdown);
        if (!cancelled) {
          setRawHtml(html);
          // Reset dismiss state so the bar reappears after new content is measured
          setWarningDismissed(false);
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

  // Post-process reactively when rawHtml or relevant styles change
  const processedHtml = React.useMemo(
    () => postProcessHtml(rawHtml, styles),
    [rawHtml, styles.contactLayout, styles.skillsDisplay, styles.dateAlignment]
  );

  // Overflow detection — runs after processedHtml updates
  const { isOverflowing, scaleFactor, measureRef } = useOverflow(
    processedHtml,
    styles,
  );

  // Notify parent of overflow state changes
  const onOverflowChangeRef = React.useRef(onOverflowChange);
  onOverflowChangeRef.current = onOverflowChange;

  React.useEffect(() => {
    onOverflowChangeRef.current?.({ isOverflowing, scaleFactor });
  }, [isOverflowing, scaleFactor]);

  // Show warning bar when overflowing AND not dismissed
  const showWarning = scaleFactor < 1.0 && !warningDismissed;

  return (
    <div
      className="h-full w-full flex flex-col bg-gray-50 overflow-hidden"
      role="region"
      aria-label="Resume preview"
    >
      {/* Off-screen measurement container — hidden, not visible */}
      <MeasureContainer
        measureRef={measureRef}
        styles={styles}
      />

      {/* Overflow warning bar — slides in from top when scaling is active */}
      {showWarning && (
        <OverflowWarning
          scaleFactor={scaleFactor}
          onDismiss={() => setWarningDismissed(true)}
        />
      )}

      {/* Scrollable paper area */}
      <div className="flex-1 overflow-y-auto" aria-live="polite">
        {isRendering && !rawHtml ? (
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
              styles={styles}
              htmlContent={processedHtml}
              contentScaleFactor={scaleFactor}
            />
          </div>
        )}
      </div>
    </div>
  );
}
