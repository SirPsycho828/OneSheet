import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { createResume } from "../../services/resumes";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { PRESET_DEFAULTS } from "../../constants/presets";
import { STARTER_TEMPLATES } from "../../constants/starterTemplates";

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateResumeModal({ isOpen, onClose }: CreateResumeModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [title, setTitle] = React.useState("");
  const [selectedStarter, setSelectedStarter] = React.useState("custom");
  const [isCreating, setIsCreating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle("");
      setSelectedStarter("custom");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  async function handleCreate() {
    if (!user) return;
    const trimmedTitle = title.trim() || "Untitled Resume";
    const starter = STARTER_TEMPLATES.find((t) => t.id === selectedStarter);
    const starterMarkdown = starter?.markdown ?? "";

    setIsCreating(true);
    try {
      const paperSize = user.paperSize ?? "us-letter";
      const newId = await createResume({
        userId: user.uid,
        title: trimmedTitle,
        markdown: starterMarkdown,
        templateId: "classic",
        isDefault: false,
        paperSize,
        overflow: { isOverflowing: false, scaleFactor: 1 },
        styles: { ...PRESET_DEFAULTS.classic, pageSize: paperSize },
        showQrCode: false,
        qrCodeUrl: null,
      });
      onClose();
      navigate(`/editor/${newId}`);
    } catch {
      toast.error("Failed to create resume. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleCreate();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Resume">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="resume-title-input"
            className="text-sm font-medium text-foreground"
          >
            Title
          </label>
          <input
            ref={inputRef}
            id="resume-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., Frontend, Backend, Startup"
            maxLength={80}
            className={[
              "h-9 px-3 text-sm rounded-md border border-input",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
              "placeholder:text-muted-foreground",
            ].join(" ")}
          />
        </div>

        {/* Starter template picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Start from
          </span>
          <div className="grid grid-cols-2 gap-2">
            {STARTER_TEMPLATES.map((t) => {
              const selected = selectedStarter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedStarter(t.id)}
                  className={[
                    "relative text-left rounded-md border p-2.5 text-sm transition-colors",
                    selected
                      ? "border-primary bg-secondary ring-1 ring-primary"
                      : "border-border hover:border-border/80 hover:bg-muted",
                  ].join(" ")}
                >
                  <p className="font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  {selected && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-primary" strokeWidth={2} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCreate} isLoading={isCreating}>
            Create
          </Button>
        </div>
      </div>
    </Modal>
  );
}
