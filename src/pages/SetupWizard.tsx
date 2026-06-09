import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Sparkles } from "lucide-react";
import { createResume } from "../services/resumes";
import { markWizardCompleted } from "../services/onboarding";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { PRESET_DEFAULTS } from "../constants/presets";
import { STARTER_TEMPLATES } from "../constants/starterTemplates";

type WizardStep = "welcome" | "create-resume" | "done";

const STEPS: WizardStep[] = ["welcome", "create-resume", "done"];

function StepIndicator({ current }: { current: WizardStep }) {
  const labels = ["Welcome", "Create Resume", "Done"];
  const currentIdx = STEPS.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const completed = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 sm:w-10 ${completed ? "bg-primary" : "bg-border"}`}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className={[
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  completed
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                ].join(" ")}
              >
                {completed ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs hidden sm:inline ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}
              >
                {labels[i]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SetupWizard() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [step, setStep] = useState<WizardStep>("welcome");
  const [title, setTitle] = useState("");
  const [selectedStarter, setSelectedStarter] = useState("engineer");
  const [isCreating, setIsCreating] = useState(false);
  const [createdResumeId, setCreatedResumeId] = useState<string | null>(null);

  async function handleCreateResume() {
    if (!user) return;
    setIsCreating(true);
    try {
      const starter = STARTER_TEMPLATES.find((t) => t.id === selectedStarter);
      const trimmedTitle = title.trim() || "My Resume";
      const paperSize = user.paperSize ?? "us-letter";
      const newId = await createResume({
        userId: user.uid,
        title: trimmedTitle,
        markdown: starter?.markdown ?? "",
        templateId: "classic",
        isDefault: true,
        paperSize,
        overflow: { isOverflowing: false, scaleFactor: 1 },
        styles: { ...PRESET_DEFAULTS.classic, pageSize: paperSize },
        showQrCode: false,
        qrCodeUrl: null,
      });
      setCreatedResumeId(newId);
      await markWizardCompleted(user.uid);
      await refreshUser();
      setStep("done");
    } catch {
      toast.error("Failed to create resume. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSkip() {
    if (!user) return;
    await markWizardCompleted(user.uid);
    await refreshUser();
    navigate("/dashboard", { replace: true });
  }

  function handleFinish() {
    // Schedule tour for after wizard
    localStorage.setItem("onesheet-tour-pending", "true");
    if (createdResumeId) {
      navigate(`/editor/${createdResumeId}`, { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border">
        <img src="/logo.png" alt="OneSheet" className="h-5" />
        <StepIndicator current={step} />
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {step === "welcome" && (
            <div className="text-center">
              <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-foreground mb-2">
                Welcome to OneSheet
              </h1>
              <p className="text-muted-foreground mb-2">
                Let's get you set up with your first resume. It only takes a minute.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                You'll pick a starter template and give it a name. You can customize everything later in the editor.
              </p>
              <button
                type="button"
                onClick={() => setStep("create-resume")}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-600 transition-colors"
              >
                Let's go
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "create-resume" && (
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
                Create your first resume
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Pick a starter template to get going quickly. You can change everything later.
              </p>

              <div className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="wizard-title"
                    className="text-sm font-medium text-foreground"
                  >
                    Resume title
                  </label>
                  <input
                    id="wizard-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Frontend, Backend, General"
                    maxLength={80}
                    className="h-9 px-3 text-sm rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground"
                  />
                </div>

                {/* Template picker */}
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
                          <p className="font-medium text-foreground">
                            {t.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.description}
                          </p>
                          {selected && (
                            <Check
                              className="absolute top-2 right-2 w-4 h-4 text-primary"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("welcome")}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateResume}
                    disabled={isCreating}
                    className="inline-flex items-center gap-1.5 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? "Creating..." : "Create resume"}
                    {!isCreating && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="text-center">
              <div className="mx-auto mb-6 w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600" strokeWidth={2.5} />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-2">
                You're all set!
              </h2>
              <p className="text-muted-foreground mb-8">
                Your resume has been created. Head to the editor to start customizing it.
              </p>
              <button
                type="button"
                onClick={handleFinish}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-brand-600 transition-colors"
              >
                Open editor
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
