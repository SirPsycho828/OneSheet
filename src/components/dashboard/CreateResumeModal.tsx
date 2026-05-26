import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { createResume } from "../../services/resumes";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { PRESET_DEFAULTS } from "../../constants/presets";

interface CreateResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateResumeModal({ isOpen, onClose }: CreateResumeModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [title, setTitle] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setTitle("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  async function handleCreate() {
    if (!user) return;
    const trimmedTitle = title.trim() || "Untitled Resume";
    setIsCreating(true);
    try {
      const paperSize = user.paperSize ?? "us-letter";
      const newId = await createResume({
        userId: user.uid,
        title: trimmedTitle,
        markdown: "",
        templateId: "classic",
        isDefault: false,
        paperSize,
        overflow: { isOverflowing: false, scaleFactor: 1 },
        styles: { ...PRESET_DEFAULTS.classic, pageSize: paperSize },
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
            className="text-sm font-medium text-gray-700"
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
              "h-9 px-3 text-sm rounded-md border border-gray-300",
              "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
              "placeholder:text-gray-400",
            ].join(" ")}
          />
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
