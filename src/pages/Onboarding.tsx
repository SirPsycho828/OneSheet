import { useState, useCallback, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { checkUsernameAvailability, claimUsername } from "../services/usernames";
import { signOut } from "../services/auth";

type CheckState = "idle" | "checking" | "available" | "taken";

export function Onboarding() {
  const { firebaseUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [checkMessage, setCheckMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  // Debounced availability check
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

  // Debounce timer ref via closure
  let debounceTimer: ReturnType<typeof setTimeout>;
  function handleUsernameChange(value: string) {
    // Normalize to lowercase
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
      // Derive display name: OAuth profile name, or email local part
      const displayName =
        firebaseUser.displayName ||
        (firebaseUser.email ? firebaseUser.email.split("@")[0] : username);

      await claimUsername(
        firebaseUser.uid,
        username,
        displayName,
        firebaseUser.email ?? ""
      );

      // Re-evaluate auth state so route guards redirect appropriately
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
      ? "text-green-600"
      : checkState === "taken"
        ? "text-red-600"
        : "text-gray-400";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight text-gray-950">
            BragSheet
          </span>
          <h1 className="mt-2 text-xl font-medium text-gray-800">Choose your username</h1>
          <p className="mt-1 text-sm text-gray-500">
            This will be your public profile URL:
          </p>
          <p className="mt-0.5 min-h-[1.25rem] font-mono text-sm text-gray-700">
            bragsheet.com/{username || "yourname"}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {submitError && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                placeholder="yourname"
                maxLength={30}
              />
              <p className={`text-xs ${checkColorClass} min-h-[1rem]`}>
                {checkState === "checking"
                  ? "Checking availability..."
                  : checkMessage || "\u00A0"}
              </p>
              <p className="text-xs text-gray-400">
                3–30 characters. Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || checkState !== "available"}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Claiming username..." : "Claim username"}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
