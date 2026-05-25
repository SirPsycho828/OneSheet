import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Wraps protected pages (editor, dashboard, settings).
 * Requires "authenticated" state. All other states redirect appropriately.
 */
export function PrivateRoute() {
  const { authState } = useAuth();

  if (authState === "loading") {
    return <AuthLoadingSpinner />;
  }

  if (authState === "unauthenticated") {
    return <Navigate to="/sign-in" replace />;
  }

  if (authState === "needs_onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (authState === "unverified") {
    return <Navigate to="/verify-email" replace />;
  }

  // authenticated — render the protected page
  return <Outlet />;
}

function AuthLoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
    </div>
  );
}
