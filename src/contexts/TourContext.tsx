import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../hooks/useAuth";

const TOUR_COMPLETED_KEY = "onesheet-tour-completed";
const TOUR_PENDING_KEY = "onesheet-tour-pending";

interface TourStep {
  target: string;
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="new-resume"]',
    title: "Create resumes",
    content:
      "Tap here to create a new resume. Pick a starter template or start from scratch.",
  },
  {
    target: '[data-tour="resume-card"]',
    title: "Your resumes",
    content:
      "Each card is a resume. Click to edit, or use the menu for more options like duplicate and delete.",
  },
  {
    target: '[data-tour="sort-resumes"]',
    title: "Sort and organize",
    content: "Sort your resumes by last updated, name, or most viewed.",
  },
  {
    target: '[data-tour="view-profile"]',
    title: "Your public profile",
    content:
      "See how your resume looks to others. Share the link with recruiters and hiring managers.",
  },
  {
    target: '[data-tour="dashboard-menu"]',
    title: "Settings and more",
    content:
      "Access your account settings, subscription, API keys, and sign out from here.",
  },
];

interface TourContextValue {
  startTour: () => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Tooltip positioned near the target element
// ---------------------------------------------------------------------------

interface TooltipPosition {
  top: number;
  left: number;
  arrowSide: "top" | "bottom";
}

function getTooltipPosition(
  targetRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const gap = 12;
  const padding = 8;

  // Try below first, then above
  let top: number;
  let arrowSide: "top" | "bottom" = "top";

  if (targetRect.bottom + gap + tooltipHeight < window.innerHeight) {
    top = targetRect.bottom + gap;
    arrowSide = "top";
  } else {
    top = targetRect.top - gap - tooltipHeight;
    arrowSide = "bottom";
  }

  // Center horizontally on target, clamped to viewport
  let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
  left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

  return { top, left, arrowSide };
}

// ---------------------------------------------------------------------------
// Spotlight overlay with cutout around target
// ---------------------------------------------------------------------------

function SpotlightOverlay({
  targetRect,
  onClick,
}: {
  targetRect: DOMRect;
  onClick: () => void;
}) {
  const pad = 6;
  const r = 8;
  const { innerWidth: vw, innerHeight: vh } = window;

  const x = targetRect.left - pad;
  const y = targetRect.top - pad;
  const w = targetRect.width + pad * 2;
  const h = targetRect.height + pad * 2;

  return (
    <svg
      onClick={onClick}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 9998 }}
    >
      <defs>
        <mask id="tour-mask">
          <rect width={vw} height={vh} fill="white" />
          <rect x={x} y={y} width={w} height={h} rx={r} fill="black" />
        </mask>
      </defs>
      <rect
        width={vw}
        height={vh}
        fill="rgba(0,0,0,0.45)"
        mask="url(#tour-mask)"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Tour UI rendered via portal
// ---------------------------------------------------------------------------

function TourOverlay({
  stepIndex,
  onNext,
  onBack,
  onSkip,
}: {
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const step = TOUR_STEPS[stepIndex];
  const isLast = stepIndex === TOUR_STEPS.length - 1;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<TooltipPosition | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    function position() {
      const el = document.querySelector(step.target);
      if (!el) {
        // Skip steps with missing targets (e.g. on mobile)
        onNext();
        return;
      }

      const rect = el.getBoundingClientRect();
      setTargetRect(rect);

      const tw = Math.min(296, window.innerWidth - 16);
      const th = 140; // estimate; recalculate after render
      setPos(getTooltipPosition(rect, tw, th));

      // Scroll target into view if needed
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    position();

    // Reposition on scroll/resize
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [step.target]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refine position after tooltip renders
  useEffect(() => {
    if (!tooltipRef.current || !targetRect) return;
    const { offsetWidth, offsetHeight } = tooltipRef.current;
    setPos(getTooltipPosition(targetRect, offsetWidth, offsetHeight));
  }, [targetRect]);

  if (!pos || !targetRect) return null;

  return createPortal(
    <>
      <SpotlightOverlay targetRect={targetRect} onClick={onSkip} />
      <div
        ref={tooltipRef}
        className="fixed bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs"
        style={{
          zIndex: 9999,
          top: pos.top,
          left: pos.left,
          width: Math.min(296, window.innerWidth - 16),
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-foreground">
            {step.title}
          </h3>
          <span className="text-xs text-muted-foreground">
            {stepIndex + 1}/{TOUR_STEPS.length}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{step.content}</p>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={onNext}
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-brand-600 transition-colors"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function TourProvider({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  function completeTour() {
    setActive(false);
    setStepIndex(0);
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    localStorage.removeItem(TOUR_PENDING_KEY);
  }

  const startTour = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  function handleNext() {
    if (stepIndex >= TOUR_STEPS.length - 1) {
      completeTour();
    } else {
      setStepIndex((i) => i + 1);
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
  }

  // Auto-start for any authenticated user who hasn't completed the tour
  useEffect(() => {
    if (authState !== "authenticated") return;

    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (completed) return;

    const timer = setTimeout(() => {
      setStepIndex(0);
      setActive(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [authState]);

  // Check for pending tour (scheduled by wizard)
  useEffect(() => {
    if (authState !== "authenticated") return;

    const pending = localStorage.getItem(TOUR_PENDING_KEY);
    if (!pending) return;

    localStorage.removeItem(TOUR_PENDING_KEY);
    const timer = setTimeout(() => {
      setStepIndex(0);
      setActive(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [authState]);

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      {active && (
        <TourOverlay
          stepIndex={stepIndex}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={completeTour}
        />
      )}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return ctx;
}

/** Clear tour completion state (for settings "replay" button). */
export function clearTourCompletion(): void {
  localStorage.removeItem(TOUR_COMPLETED_KEY);
}
