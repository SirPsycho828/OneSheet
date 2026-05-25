import { useState, useEffect, useRef, useCallback } from "react";
import { getResume, getDefaultResume, updateResume } from "../services/resumes";
import { useAuth } from "./useAuth";
import { useDebounce } from "./useDebounce";
import type { Resume, Overflow } from "../types/resume";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

const AUTO_SAVE_DELAY = 1500;

export function useResume(resumeId?: string) {
  const { firebaseUser } = useAuth();

  // Server-fetched resume document
  const [resume, setResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local editing state — drives the UI immediately, no waiting for Firestore
  const [markdown, setMarkdown] = useState("");
  const [title, setTitle] = useState("");
  const [templateId, setTemplateId] = useState("classic");
  const [paperSize, setPaperSize] = useState<"us-letter" | "a4">("us-letter");

  // Overflow state — updated by the preview component on every measurement
  const overflowRef = useRef<Overflow>({ isOverflowing: false, scaleFactor: 1.0 });

  // Save tracking
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // Track what was last successfully saved so we can deduplicate
  const lastSavedRef = useRef<{
    markdown: string;
    title: string;
    templateId: string;
    paperSize: "us-letter" | "a4";
  } | null>(null);

  // Ref to the actual resume ID (may resolve asynchronously for default resume)
  const resumeIdRef = useRef<string | null>(null);

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
          setMarkdown(loaded.markdown);
          setTitle(loaded.title);
          setTemplateId(loaded.templateId);
          setPaperSize(loaded.paperSize ?? "us-letter");
          resumeIdRef.current = loaded.id;

          // Seed last-saved ref so first auto-save only fires on real changes
          lastSavedRef.current = {
            markdown: loaded.markdown,
            title: loaded.title,
            templateId: loaded.templateId,
            paperSize: loaded.paperSize ?? "us-letter",
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
      paperSize !== lastSavedRef.current.paperSize;

    if (dirty) setSaveStatus("unsaved");
  }, [markdown, title, templateId, paperSize, isLoading]);

  // ---------------------------------------------------------------------------
  // Core save function (shared by auto-save and forceSave)
  // ---------------------------------------------------------------------------
  const save = useCallback(async () => {
    const id = resumeIdRef.current;
    if (!id) return;

    const current = { markdown, title, templateId, paperSize };

    // Deduplicate: skip if nothing changed since last successful save
    if (
      lastSavedRef.current &&
      current.markdown === lastSavedRef.current.markdown &&
      current.title === lastSavedRef.current.title &&
      current.templateId === lastSavedRef.current.templateId &&
      current.paperSize === lastSavedRef.current.paperSize
    ) {
      setSaveStatus("saved");
      return;
    }

    setSaveStatus("saving");
    try {
      // Include the latest overflow state from the preview measurement
      await updateResume(id, { ...current, overflow: overflowRef.current });
      lastSavedRef.current = current;
      setSaveStatus("saved");
    } catch (err) {
      console.error("useResume: save failed", err);
      setSaveStatus("error");
    }
  }, [markdown, title, templateId, paperSize]);

  // ---------------------------------------------------------------------------
  // Auto-save: debounced 1500ms after last change
  // ---------------------------------------------------------------------------
  const debouncedMarkdown = useDebounce(markdown, AUTO_SAVE_DELAY);
  const debouncedTitle = useDebounce(title, AUTO_SAVE_DELAY);
  const debouncedTemplateId = useDebounce(templateId, AUTO_SAVE_DELAY);
  const debouncedPaperSize = useDebounce(paperSize, AUTO_SAVE_DELAY);

  useEffect(() => {
    if (isLoading) return;
    if (saveStatus === "saved") return;

    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMarkdown, debouncedTitle, debouncedTemplateId, debouncedPaperSize]);

  // ---------------------------------------------------------------------------
  // forceSave: immediate save, bypasses debounce (used by Ctrl+S)
  // ---------------------------------------------------------------------------
  const forceSave = useCallback(async () => {
    await save();
  }, [save]);

  /**
   * Called by ResumePreview after each overflow measurement.
   * Stores the latest state in a ref so the next auto-save includes it.
   * Does NOT trigger a re-render — overflow save happens piggyback on content saves.
   */
  const setOverflow = useCallback((state: Overflow) => {
    overflowRef.current = state;
  }, []);

  return {
    resume,
    isLoading,
    markdown,
    setMarkdown,
    title,
    setTitle,
    templateId,
    setTemplateId,
    paperSize,
    setPaperSize,
    saveStatus,
    forceSave,
    setOverflow,
  };
}
