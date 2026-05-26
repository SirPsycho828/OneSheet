import { useState, useEffect } from "react";
import { Mail } from "lucide-react";
import { sendVerification, signOut } from "../services/auth";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AuthLayout } from "../components/auth/AuthLayout";

const RESEND_COOLDOWN_SECONDS = 60;

export function VerifyEmail() {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();

  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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
    <AuthLayout>
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Mail className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>

        <h1 className="font-heading text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a verification link to{" "}
          <span className="font-medium text-foreground">{email}</span>. Click the link to
          activate your account.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {sent && !error && (
          <p className="mt-4 rounded-md bg-success/10 px-4 py-3 text-sm text-success">
            Verification email resent!
          </p>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="w-full rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification email"}
          </button>
        </div>
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
