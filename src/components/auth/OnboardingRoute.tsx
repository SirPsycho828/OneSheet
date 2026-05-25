import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Wraps the onboarding page.
 * Only accessible when authState === "needs_onboarding".
 * Authenticated users go to the editor; unauthenticated users go to sign-in.
 */
export function OnboardingRoute() {
  const { authState } = useAuth();

  if (authState === "loading") {
    return <AuthLoadingSpinner />;
  }

  if (authState === "authenticated") {
    return <Navigate to="/editor" replace />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/sign-in" replace />;
  }

  if (authState === "unverified") {
    return <Navigate to="/verify-email" replace />;
  }

  // needs_onboarding — render the onboarding page
  return <Outlet />;
}

function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
    </div>
  );
}
