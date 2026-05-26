import { useState, useEffect } from "react";
import { sendVerification, signOut } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmail() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    setError("");
    try {
      await sendVerification();
      setSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Failed to resend verification email. Please try again.");
    }
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  const email = firebaseUser?.email ?? "your email";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6">
          <span className="text-2xl font-semibold tracking-tight text-gray-950">
            OneSheet
          </span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* Mail icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-7 w-7 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h1 className="text-xl font-medium text-gray-900">Check your email</h1>
          <p className="mt-2 text-sm text-gray-500">
            We sent a verification link to{" "}
            <span className="font-medium text-gray-700">{email}</span>. Click the link to
            activate your account.
          </p>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          {sent && !error && (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              Verification email resent!
            </p>
          )}

          <div className="mt-6">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown > 0
                ? `Resend in ${cooldown}s`
                : "Resend verification email"}
            </button>
          </div>
        </div>

        <div className="mt-4">
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
