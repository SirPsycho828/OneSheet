import * as React from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import { TemplateCard } from "./TemplateCard";
import { TEMPLATES } from "../../constants/templates";
import { renderMarkdown } from "../../lib/markdown";
import { useToast } from "../../hooks/useToast";

export interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (templateId: string) => void;
  currentTemplateId: string;
  markdown: string;
  paperSize: "us-letter" | "a4";
  isPaid: boolean;
}

const FREE_TEMPLATES = new Set(["classic"]);

/**
 * Full-screen template picker overlay.
 *
 * When opened it renders the user's actual markdown through every template
 * once and caches the resulting HTML strings. Users click a card to select
 * a template, then "Apply" to commit or "Cancel"/"Escape" to dismiss.
 */
export function TemplatePicker({
  isOpen,
  onClose,
  onApply,
  currentTemplateId,
  markdown,
  isPaid,
}: TemplatePickerProps) {
  const toast = useToast();

  // The template the user has highlighted inside the picker (may differ from
  // the currently applied template until they press "Apply").
  const [selectedId, setSelectedId] = React.useState(currentTemplateId);

  // Pre-rendered HTML for all templates. Keyed by template id.
  const [renderedHtml, setRenderedHtml] = React.useState<
    Record<string, string>
  >({});
  const [isRendering, setIsRendering] = React.useState(false);

  // Reset selected template and trigger rendering whenever picker opens.
  React.useEffect(() => {
    if (!isOpen) return;

    setSelectedId(currentTemplateId);

    // Render once per open. If we already have HTML for all templates and the
    // markdown hasn't changed, skip re-rendering.
    const allRendered = TEMPLATES.every((t) => renderedHtml[t.id] !== undefined);
    if (allRendered) return;

    setIsRendering(true);
    Promise.all(
      TEMPLATES.map((t) =>
        renderMarkdown(markdown).then((html) => ({ id: t.id, html }))
      )
    )
      .then((results) => {
        const map: Record<string, string> = {};
        for (const { id, html } of results) {
          map[id] = html;
        }
        setRenderedHtml(map);
      })
      .catch((err) => {
        console.error("TemplatePicker: failed to render previews", err);
      })
      .finally(() => {
        setIsRendering(false);
      });
    // We intentionally only re-run when the picker opens (isOpen) or markdown
    // changes. renderedHtml is excluded to avoid an infinite loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, markdown]);

  // Re-render when markdown changes while picker is open.
  React.useEffect(() => {
    if (!isOpen) return;
    setIsRendering(true);
    Promise.all(
      TEMPLATES.map((t) =>
        renderMarkdown(markdown).then((html) => ({ id: t.id, html }))
      )
    )
      .then((results) => {
        const map: Record<string, string> = {};
        for (const { id, html } of results) {
          map[id] = html;
        }
        setRenderedHtml(map);
      })
      .catch(console.error)
      .finally(() => setIsRendering(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown]);

  // Close on Escape.
  React.useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll while open.
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleCardClick(templateId: string) {
    const isLocked = !isPaid && !FREE_TEMPLATES.has(templateId);
    if (isLocked) {
      toast.info("Upgrade to Pro to unlock this template.");
      return;
    }
    setSelectedId(templateId);
  }

  function handleApply() {
    const isLocked = !isPaid && !FREE_TEMPLATES.has(selectedId);
    if (isLocked) {
      toast.info("Upgrade to Pro to unlock this template.");
      return;
    }
    onApply(selectedId);
  }

  return (
    <div
      className="fixed inset-0 bg-white z-50 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Choose a template"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">
          Choose a template
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Close template picker"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isRendering && Object.keys(renderedHtml).length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-500">
            Loading previews…
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TEMPLATES.map((template) => {
              const isLocked = !isPaid && !FREE_TEMPLATES.has(template.id);
              return (
                <TemplateCard
                  key={template.id}
                  templateId={template.id}
                  templateName={template.name}
                  htmlContent={renderedHtml[template.id] ?? ""}
                  isSelected={selectedId === template.id}
                  isLocked={isLocked}
                  onClick={() => handleCardClick(template.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-white">
        {!isPaid && (
          <p className="text-xs text-gray-500 flex-1">
            Free plan includes the Classic template.{" "}
            <a
              href="/settings"
              className="text-brand-600 hover:underline font-medium"
            >
              Upgrade to Pro
            </a>{" "}
            to unlock all templates.
          </p>
        )}
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleApply}
          disabled={
            selectedId === currentTemplateId ||
            (!isPaid && !FREE_TEMPLATES.has(selectedId))
          }
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
