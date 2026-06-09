import { useState } from "react";
import { Link } from "react-router-dom";
import { SignUpForm } from "../components/auth/SignUpForm";
import { OAuthButtons } from "../components/auth/OAuthButtons";
import { AuthLayout } from "../components/auth/AuthLayout";

export function SignUp() {
  const [oauthError, setOauthError] = useState("");

  return (
    <AuthLayout>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start writing your resume in Markdown. You'll pick a username next.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        {oauthError && (
          <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {oauthError}
          </p>
        )}

        <OAuthButtons onError={setOauthError} />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SignUpForm />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        By signing up you agree to our{" "}
        <Link to="/terms" className="underline hover:text-foreground transition-colors">
          Terms
        </Link>{" "}
        and{" "}
        <Link to="/privacy" className="underline hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
  );
}
