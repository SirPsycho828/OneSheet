import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Download, Share2, Layout } from "lucide-react";
import { Button } from "../ui/Button";
import { OverflowMenu } from "../ui/OverflowMenu";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { auth } from "../../config/firebase";
import { signOut } from "firebase/auth";
import { TEMPLATES } from "../../constants/templates";

interface AppNavProps {
  title: string;
  onTitleChange: (title: string) => void;
  templateId: string;
  username?: string;
  onOpenTemplatePicker: () => void;
}

/**
 * Top navigation bar for the editor.
 *
 * - Logo links to dashboard
 * - Resume title is inline-editable (click to edit, blur to commit)
 * - Template button: opens TemplatePicker overlay
 * - Export PDF button: placeholder (Task 10)
 * - Share button: copies public profile URL to clipboard
 * - Kebab menu: Dashboard, Settings, Version History, Sign Out
 */
export function AppNav({ title, onTitleChange, templateId, username, onOpenTemplatePicker }: AppNavProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [localTitle, setLocalTitle] = React.useState(title);
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  // Sync local title when prop changes (e.g., initial load)
  React.useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  function handleTitleClick() {
    setIsEditingTitle(true);
    requestAnimationFrame(() => titleInputRef.current?.select());
  }

  function handleTitleBlur() {
    setIsEditingTitle(false);
    const trimmed = localTitle.trim() || "Untitled Resume";
    setLocalTitle(trimmed);
    onTitleChange(trimmed);
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      titleInputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalTitle(title); // revert
      setIsEditingTitle(false);
    }
  }

  async function handleShare() {
    const profileUsername = username ?? user?.username;
    if (!profileUsername) {
      toast.info("Your profile URL isn't available yet.");
      return;
    }
    const url = `https://bragsheet.io/${profileUsername}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    navigate("/sign-in");
  }

  const currentTemplate = TEMPLATES.find((t) => t.id === templateId);

  const menuItems = [
    {
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      label: "Settings",
      onClick: () => navigate("/settings"),
    },
    {
      label: "Version History",
      onClick: () => {
        toast.info("Version history coming soon.");
      },
    },
    {
      label: "Sign Out",
      onClick: handleSignOut,
      variant: "danger" as const,
    },
  ];

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-gray-200 bg-white flex-shrink-0">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="text-sm font-semibold tracking-tight text-gray-950 hover:text-brand-500 transition-colors flex-shrink-0"
      >
        BragSheet
      </Link>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden />

      {/* Resume title — inline editable */}
      <div className="flex-1 min-w-0 flex justify-center">
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={handleTitleKeyDown}
            className={[
              "w-full max-w-xs text-center text-sm font-medium text-gray-900",
              "bg-transparent border-b border-brand-500 outline-none",
              "pb-0.5",
            ].join(" ")}
            aria-label="Resume title"
          />
        ) : (
          <button
            type="button"
            onClick={handleTitleClick}
            className={[
              "max-w-xs truncate text-sm font-medium text-gray-900",
              "hover:text-brand-500 transition-colors",
              "rounded px-1 py-0.5",
            ].join(" ")}
            title="Click to rename"
          >
            {localTitle || "Untitled Resume"}
          </button>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Template button */}
        <Button
          variant="ghost"
          className="hidden sm:inline-flex items-center gap-1.5 text-xs"
          onClick={onOpenTemplatePicker}
          title="Change template"
        >
          <Layout className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden md:inline">{currentTemplate?.name ?? "Template"}</span>
        </Button>

        {/* Share button */}
        <Button
          variant="ghost"
          className="text-xs"
          onClick={handleShare}
          title="Copy public profile link"
        >
          <Share2 className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden md:inline">Share</span>
        </Button>

        {/* Export PDF */}
        <Button
          variant="primary"
          className="text-xs"
          onClick={() => toast.info("PDF export coming soon.")}
          title="Export as PDF"
        >
          <Download className="w-4 h-4" strokeWidth={1.5} />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>

        {/* Kebab menu */}
        <OverflowMenu items={menuItems} triggerLabel="Editor menu" />
      </div>
    </header>
  );
}
