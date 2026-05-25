import { SignInForm } from "../components/auth/SignInForm";
import { OAuthButtons } from "../components/auth/OAuthButtons";
import { useState } from "react";
import { Link } from "react-router-dom";

export function SignIn() {
  const [oauthError, setOauthError] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-semibold tracking-tight text-gray-950">
            BragSheet
          </Link>
          <h1 className="mt-2 text-xl font-medium text-gray-800">Welcome back</h1>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          {oauthError && (
            <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {oauthError}
            </p>
          )}

          <OAuthButtons onError={setOauthError} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">or</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <SignInForm />
        </div>
      </div>
    </div>
  );
}
