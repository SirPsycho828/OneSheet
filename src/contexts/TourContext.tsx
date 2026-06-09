import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  Joyride,
  type CallBackProps,
  type Step,
  STATUS,
  ACTIONS,
} from "react-joyride";
import { useAuth } from "../hooks/useAuth";

const TOUR_COMPLETED_KEY = "onesheet-tour-completed";
const TOUR_PENDING_KEY = "onesheet-tour-pending";

interface TourContextValue {
  startTour: () => void;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="new-resume"]',
    title: "Create resumes",
    content:
      "Tap here to create a new resume. Pick a starter template or start from scratch.",
    disableBeacon: true,
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

function TourTooltip({
  step,
  index,
  size,
  isLastStep,
  primaryProps,
  skipProps,
  backProps,
}: {
  continuous: boolean;
  step: Step;
  index: number;
  size: number;
  isLastStep: boolean;
  primaryProps: { onClick: () => void; title: string };
  skipProps: { onClick: () => void; title: string };
  backProps: { onClick: () => void; title: string };
}) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-foreground">
          {step.title as string}
        </h3>
        <span className="text-xs text-muted-foreground">
          {index + 1}/{size}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3">
        {step.content as string}
      </p>
      <div className="flex items-center justify-between">
        <button
          type="button"
          {...skipProps}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              type="button"
              {...backProps}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            {...primaryProps}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-brand-600 transition-colors"
          >
            {isLastStep ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TourProvider({ children }: { children: ReactNode }) {
  const { authState } = useAuth();
  const [run, setRun] = useState(false);

  const startTour = useCallback(() => {
    setRun(true);
  }, []);

  // Auto-start tour for any authenticated user who hasn't completed it
  useEffect(() => {
    if (authState !== "authenticated") return;

    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (completed) return;

    // Delay to let the page render and tour targets mount
    const timer = setTimeout(() => {
      setRun(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [authState]);

  // Also check for pending tour (triggered by wizard completion)
  useEffect(() => {
    if (authState !== "authenticated") return;

    const pending = localStorage.getItem(TOUR_PENDING_KEY);
    if (!pending) return;

    localStorage.removeItem(TOUR_PENDING_KEY);
    const timer = setTimeout(() => {
      setRun(true);
    }, 800);

    return () => clearTimeout(timer);
  }, [authState]);

  function handleCallback(data: CallBackProps) {
    const { status, action } = data;

    if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      action === ACTIONS.CLOSE
    ) {
      setRun(false);
      localStorage.setItem(TOUR_COMPLETED_KEY, "true");
      localStorage.removeItem(TOUR_PENDING_KEY);
    }
  }

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
      <Joyride
        steps={TOUR_STEPS}
        run={run}
        continuous
        showSkipButton
        disableOverlayClose
        spotlightClicks
        callback={handleCallback}
        tooltipComponent={TourTooltip as never}
        styles={{
          options: {
            zIndex: 10000,
            arrowColor: "#FFFFFF",
            overlayColor: "rgba(0, 0, 0, 0.4)",
          },
        }}
        floaterProps={{
          disableAnimation: true,
        }}
      />
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
