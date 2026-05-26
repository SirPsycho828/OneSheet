import { useState, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { checkUsernameAvailability, claimUsername } from "../services/usernames";
import { signOut } from "../services/auth";
import { AuthLayout } from "../components/auth/AuthLayout";

type CheckState = "idle" | "checking" | "available" | "taken";

const inputClass =
  "rounded-md border border-input bg-card px-3 py-2.5 font-mono text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground";

export function Onboarding() {
  const { firebaseUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkMessage, setCheckMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkAvailability = useCallback(async (value: string) => {
    if (value.length < 3) {
      setCheckState("idle");
      setCheckMessage("");
      return;
    }

    setCheckState("checking");
    const result = await checkUsernameAvailability(value);
    if (result.available) {
      setCheckState("available");
      setCheckMessage("Username is available!");
    } else {
      setCheckState("taken");
      setCheckMessage(result.reason);
    }
  }, []);

  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleUsernameChange(value: string) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setUsername(normalized);
    setCheckState("idle");
    setCheckMessage("");
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => checkAvailability(normalized), 400);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError("");

    if (!firebaseUser) {
      setSubmitError("No authenticated user found. Please sign in again.");
      return;
    }

    if (checkState !== "available") {
      setSubmitError("Please choose an available username first.");
      return;
    }

    setLoading(true);
    try {
      const displayName =
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split("@")[0] : username);

      await claimUsername(
        firebaseUser.uid,
        username,
        displayName,
        firebaseUser.email ?? ""
      );

      await refreshUser();
    } catch (err) {
      console.error("Onboarding error:", err);
      setSubmitError("Failed to claim username. It may have just been taken. Try another.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const checkColorClass =
    checkState === "available"
      ? "text-success"
      : checkState === "taken"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Choose your username</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This will be your public profile URL:
        </p>
        <p className="mt-1 font-mono text-sm text-foreground">
          onesheet.cv/<span className="text-primary">{username || "yourname"}</span>
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {submitError && (
          <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {submitError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              className={inputClass}
              placeholder="yourname"
              maxLength={30}
            />
            <p className={`text-xs ${checkColorClass} min-h-[1rem]`}>
              {checkState === "checking"
                ? "Checking availability..."
                : checkMessage || "\u00A0"}
            </p>
            <p className="text-xs text-muted-foreground">
              3-30 characters. Lowercase letters, numbers, and hyphens only.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || checkState !== "available"}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Claiming username..." : "Claim username"}
          </button>
        </form>
      </div>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
        >
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}
