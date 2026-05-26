import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { signInWithEmail, resetPassword } from "../../services/auth";

const inputClass =
  "rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Please try again later.");
      } else {
        setError("Sign in failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email address above, then click Forgot password.");
      return;
    }
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch {
      setError("Failed to send reset email. Check the address and try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}
      {resetSent && (
        <p className="rounded-md bg-success/10 px-4 py-3 text-sm text-success">
          Password reset email sent. Check your inbox.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="you@example.com"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleForgotPassword}
          className="text-sm text-accent hover:text-accent/80 transition-colors"
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/sign-up" className="font-medium text-foreground hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
