import * as React from "react";
import { Link2, Download } from "lucide-react";
import { Button } from "../ui/Button";
import { useToast } from "../../hooks/useToast";

interface ProfileActionsProps {
  username: string;
  /** Only true when the viewer is the authenticated owner with an active subscription */
  canDownload: boolean;
  resumeId?: string;
}

/**
 * Action buttons shown below the public profile resume.
 *
 * - "Copy Link" — always visible, copies the profile URL to clipboard.
 * - "Download PDF" — only visible when canDownload is true (owner + paid).
 */
export function ProfileActions({
  username,
  canDownload,
  resumeId,
}: ProfileActionsProps) {
  const toast = useToast();
  const [copying, setCopying] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);

  const profileUrl = `${window.location.origin}/${username}`;

  async function handleCopyLink() {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    } finally {
      setCopying(false);
    }
  }

  async function handleDownloadPdf() {
    if (!resumeId) return;
    setDownloading(true);
    try {
      const apiBase =
        (import.meta.env as Record<string, string>).VITE_FUNCTIONS_URL ??
        `https://us-central1-${(import.meta.env as Record<string, string>).VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/api`;

      const { auth } = await import("../../config/firebase");
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        toast.error("You must be signed in to download");
        return;
      }

      const res = await fetch(`${apiBase}/api/pdf/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ resumeId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(
          (err as { error?: { message?: string } })?.error?.message ??
            "PDF download failed"
        );
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${username}-resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Resume downloaded");
    } catch {
      toast.error("PDF download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 py-6">
      <Button variant="secondary" onClick={handleCopyLink} isLoading={copying}>
        <Link2 className="w-4 h-4" strokeWidth={1.5} />
        Copy Link
      </Button>

      {canDownload && (
        <Button
          variant="primary"
          onClick={handleDownloadPdf}
          isLoading={downloading}
        >
          <Download className="w-4 h-4" strokeWidth={1.5} />
          Download PDF
        </Button>
      )}
    </div>
  );
}
