import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { signUpWithEmail } from "../../services/auth";

const inputClass =
  "rounded-md border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground";

export function SignUpForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.");
      } else if (code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
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
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          id="confirm"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/sign-in" className="font-medium text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
