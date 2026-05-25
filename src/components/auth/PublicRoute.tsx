import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Wraps public pages (sign-in, sign-up, landing).
 * Redirects any signed-in user to the appropriate destination.
 * MUST handle all signed-in states — not just "authenticated" — to avoid
 * trapping new Google OAuth users (who land in "needs_onboarding") on the sign-in page.
 */
export function PublicRoute() {
  const { authState } = useAuth();

  if (authState === "loading") {
    return <AuthLoadingSpinner />;
  }

  if (authState === "authenticated") {
    return <Navigate to="/editor" replace />;
  }

  if (authState === "needs_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (authState === "unverified") {
    return <Navigate to="/verify-email" replace />;
  }

  // unauthenticated — render the public page
  return <Outlet />;
}

function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
    </div>
  );
}
