import { useState, useEffect, useRef, useCallback } from "react";
import { getResume, getDefaultResume, updateResume } from "../services/resumes";
import { useAuth } from "./useAuth";
import { useDebounce } from "./useDebounce";
import { useOnlineStatus } from "./useOnlineStatus";
import type { Resume, Overflow, ResumeStyles } from "../types/resume";
import { deriveStyles } from "../constants/presets";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error" | "offline";

const AUTO_SAVE_DELAY = 1500;

// Retry backoff schedule in milliseconds: 2s, 5s, 15s, 30s, 60s (then cap at 60s)
const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000];

// After this many consecutive failures, show "local backup" messaging
const LOCAL_BACKUP_FAILURE_THRESHOLD = 3;

interface LocalBackup {
  markdown: string;
  title: string;
  templateId: string;
  paperSize: "us-letter" | "a4";
  styles?: ResumeStyles;
  timestamp: number;
}

function backupKey(resumeId: string) {
  return `bragsheet_backup_${resumeId}`;
}

function writeLocalBackup(resumeId: string, data: Omit<LocalBackup, "timestamp">) {
  try {
    const backup: LocalBackup = { ...data, timestamp: Date.now() };
    localStorage.setItem(backupKey(resumeId), JSON.stringify(backup));
  } catch {
    // localStorage may be unavailable; ignore silently
  }
}

function readLocalBackup(resumeId: string): LocalBackup | null {
  try {
    const raw = localStorage.getItem(backupKey(resumeId));
    if (!raw) return null;
    return JSON.parse(raw) as LocalBackup;
  } catch {
    return null;
  }
}

function clearLocalBackup(resumeId: string) {
  try {
    localStorage.removeItem(backupKey(resumeId));
  } catch {
    // ignore
  }
}

export function useResume(resumeId?: string) {
  const { firebaseUser } = useAuth();
  const isOnline = useOnlineStatus();

  // Server-fetched resume document
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local editing state — drives the UI immediately, no waiting for Firestore
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("classic");
  const [paperSize, setPaperSize] = useState<"us-letter" | "a4">("us-letter");
  const [showQrCode, setShowQrCode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [styles, setStyles] = useState<ResumeStyles | null>(null);

  // Overflow state — updated by the preview component on every measurement
  const overflowRef = useRef<Overflow>({ isOverflowing: false, scaleFactor: 1.0 });

  // Save tracking
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // Show a recovery banner when local backup is newer than server
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [recoveryBackup, setRecoveryBackup] = useState<LocalBackup | null>(null);

  // Track what was last successfully saved so we can deduplicate
  const lastSavedRef = useRef<{
    markdown: string;
    title: string;
    templateId: string;
    paperSize: "us-letter" | "a4";
    showQrCode: boolean;
    qrCodeUrl: string | null;
    styles: ResumeStyles | null;
  } | null>(null);

  // Ref to the actual resume ID (may resolve asynchronously for default resume)
  const resumeIdRef = useRef<string | null>(null);

  // Retry state
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pending save flag — set when offline so we sync on reconnect
  const pendingSaveRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        let loaded: Resume | null = null;

        if (resumeId) {
          loaded = await getResume(resumeId);
        } else if (firebaseUser) {
          loaded = await getDefaultResume(firebaseUser.uid);
        }

        if (cancelled) return;

        if (loaded) {
          setResume(loaded);

          // Check for a newer local backup before applying server data
          const backup = readLocalBackup(loaded.id);
          const serverUpdatedAt =
            loaded.updatedAt instanceof Date
              ? loaded.updatedAt.getTime()
              : typeof loaded.updatedAt === "object" && loaded.updatedAt !== null
              ? // Firestore Timestamp
                (loaded.updatedAt as { toMillis?: () => number }).toMillis?.() ?? 0
              : 0;

          if (backup && backup.timestamp > serverUpdatedAt + 1_000) {
            // Backup is meaningfully newer — offer recovery
            setRecoveryBackup(backup);
            setShowRecoveryBanner(true);
          }

          setMarkdown(loaded.markdown);
          setTitle(loaded.title);
          setTemplateId(loaded.templateId);
          setPaperSize(loaded.paperSize ?? "us-letter");
          setShowQrCode(loaded.showQrCode ?? false);
          setQrCodeUrl(loaded.qrCodeUrl ?? null);
          const resolvedStyles = loaded.styles ?? deriveStyles(loaded.templateId, loaded.paperSize ?? "us-letter");
          setStyles(resolvedStyles);
          resumeIdRef.current = loaded.id;

          // Seed last-saved ref so first auto-save only fires on real changes
          lastSavedRef.current = {
            markdown: loaded.markdown,
            title: loaded.title,
            templateId: loaded.templateId,
            paperSize: loaded.paperSize ?? "us-letter",
            showQrCode: loaded.showQrCode ?? false,
            qrCodeUrl: loaded.qrCodeUrl ?? null,
            styles: resolvedStyles,
          };

          setSaveStatus("saved");
        }
      } catch (err) {
        console.error("useResume: failed to load resume", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [resumeId, firebaseUser]);

  // ---------------------------------------------------------------------------
  // Mark unsaved whenever the user changes content
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isLoading) return;
    if (!lastSavedRef.current) return;

    const dirty =
      markdown !== lastSavedRef.current.markdown ||
      title !== lastSavedRef.current.title ||
      templateId !== lastSavedRef.current.templateId ||
      paperSize !== lastSavedRef.current.paperSize ||
      showQrCode !== lastSavedRef.current.showQrCode ||
      qrCodeUrl !== lastSavedRef.current.qrCodeUrl ||
      JSON.stringify(styles) !== JSON.stringify(lastSavedRef.current.styles);

    if (dirty) setSaveStatus(isOnline ? "unsaved" : "offline");
  }, [markdown, title, templateId, paperSize, showQrCode, qrCodeUrl, styles, isLoading, isOnline]);

  // ---------------------------------------------------------------------------
  // Core save function (shared by auto-save and forceSave)
  // ---------------------------------------------------------------------------
  const save = useCallback(async () => {
    const id = resumeIdRef.current;
    if (!id) return;

    // If offline, mark pending and bail out
    if (!isOnline) {
      pendingSaveRef.current = true;
      setSaveStatus("offline");
      return;
    }

    const current = {
      markdown,
      title,
      templateId: styles?.preset ?? templateId,
      paperSize: styles?.pageSize ?? paperSize,
      showQrCode,
      qrCodeUrl,
      styles: styles ?? undefined,
    };

    // Deduplicate: skip if nothing changed since last successful save
    if (
      lastSavedRef.current &&
      current.markdown === lastSavedRef.current.markdown &&
      current.title === lastSavedRef.current.title &&
      current.templateId === lastSavedRef.current.templateId &&
      current.paperSize === lastSavedRef.current.paperSize &&
      current.showQrCode === lastSavedRef.current.showQrCode &&
      current.qrCodeUrl === lastSavedRef.current.qrCodeUrl &&
      JSON.stringify(current.styles) === JSON.stringify(lastSavedRef.current.styles)
    ) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    try {
      // Include the latest overflow state from the preview measurement
      await updateResume(id, { ...current, overflow: overflowRef.current });
      lastSavedRef.current = { ...current, styles: current.styles ?? null };
      retryCountRef.current = 0;
      pendingSaveRef.current = false;
      setSaveStatus("saved");
      // Clear backup on successful save
      clearLocalBackup(id);
    } catch (err) {
      console.error("useResume: save failed", err);
      retryCountRef.current += 1;
      setSaveStatus("error");

      // Schedule retry with exponential backoff
      const delayIndex = Math.min(retryCountRef.current - 1, RETRY_DELAYS_MS.length - 1);
      const delay = RETRY_DELAYS_MS[delayIndex];

      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        save();
      }, delay);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markdown, title, templateId, paperSize, showQrCode, qrCodeUrl, styles, isOnline]);

  // ---------------------------------------------------------------------------
  // Auto-save: debounced 1500ms after last change
  // ---------------------------------------------------------------------------
  const debouncedMarkdown = useDebounce(markdown, AUTO_SAVE_DELAY);
  const debouncedTitle = useDebounce(title, AUTO_SAVE_DELAY);
  const debouncedTemplateId = useDebounce(templateId, AUTO_SAVE_DELAY);
  const debouncedPaperSize = useDebounce(paperSize, AUTO_SAVE_DELAY);
  const debouncedStyles = useDebounce(styles, AUTO_SAVE_DELAY);

  // Write localStorage backup on every debounce tick (before attempting network save)
  useEffect(() => {
    if (isLoading) return;
    const id = resumeIdRef.current;
    if (!id) return;
    writeLocalBackup(id, {
      markdown: debouncedMarkdown,
      title: debouncedTitle,
      templateId: debouncedTemplateId,
      paperSize: debouncedPaperSize,
      styles: debouncedStyles ?? undefined,
    });
  }, [debouncedMarkdown, debouncedTitle, debouncedTemplateId, debouncedPaperSize, debouncedStyles, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    if (saveStatus === "saved") return;

    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMarkdown, debouncedTitle, debouncedTemplateId, debouncedPaperSize, debouncedStyles]);

  // ---------------------------------------------------------------------------
  // Sync on reconnect: if there was a pending save, trigger immediately
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isOnline) return;
    if (!pendingSaveRef.current) return;
    // Transition from offline to online with pending changes
    setSaveStatus("unsaved");
    save();
  }, [isOnline, save]);

  // ---------------------------------------------------------------------------
  // forceSave: immediate save, bypasses debounce (used by Ctrl+S)
  // ---------------------------------------------------------------------------
  const forceSave = useCallback(async () => {
    await save();
  }, [save]);

  // ---------------------------------------------------------------------------
  // beforeunload guard: warn if there are unsaved changes
  // ---------------------------------------------------------------------------
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (saveStatus === "unsaved" || saveStatus === "error" || saveStatus === "offline") {
        const message = "You have unsaved changes. Are you sure you want to leave?";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // ---------------------------------------------------------------------------
  // Cleanup retry timer on unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  /**
   * Called by ResumePreview after each overflow measurement.
   * Stores the latest state in a ref so the next auto-save includes it.
   * Does NOT trigger a re-render — overflow save happens piggyback on content saves.
   */
  const setOverflow = useCallback((state: Overflow) => {
    overflowRef.current = state;
  }, []);

  /**
   * Accept the locally-backed-up content (from recovery banner).
   */
  const acceptRecovery = useCallback(() => {
    if (!recoveryBackup) return;
    setMarkdown(recoveryBackup.markdown);
    setTitle(recoveryBackup.title);
    setTemplateId(recoveryBackup.templateId);
    setPaperSize(recoveryBackup.paperSize);
    if (recoveryBackup.styles) setStyles(recoveryBackup.styles);
    setShowRecoveryBanner(false);
    setRecoveryBackup(null);
    setSaveStatus("unsaved");
  }, [recoveryBackup]);

  /**
   * Dismiss the recovery banner without applying the backup.
   */
  const dismissRecovery = useCallback(() => {
    const id = resumeIdRef.current;
    if (id) clearLocalBackup(id);
    setShowRecoveryBanner(false);
    setRecoveryBackup(null);
  }, []);

  // Derived: is retrying?
  const isRetrying = saveStatus === "error" && retryTimerRef.current !== null;

  // Derived: show local-backup message after threshold failures
  const isLocalBackupActive =
    saveStatus === "error" && retryCountRef.current >= LOCAL_BACKUP_FAILURE_THRESHOLD;

  return {
    resume,
    isLoading,
    resumeId: resumeIdRef.current,
    markdown,
    setMarkdown,
    title,
    setTitle,
    templateId,
    setTemplateId,
    paperSize,
    setPaperSize,
    showQrCode,
    setShowQrCode,
    qrCodeUrl,
    setQrCodeUrl,
    styles,
    setStyles,
    saveStatus,
    forceSave,
    setOverflow,
    isOnline,
    isRetrying,
    isLocalBackupActive,
    showRecoveryBanner,
    recoveryBackup,
    acceptRecovery,
    dismissRecovery,
  };
}
