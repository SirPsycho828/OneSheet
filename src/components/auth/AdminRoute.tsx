import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const ADMIN_EMAIL = "steve.petusky@gmail.com";

export function AdminRoute() {
  const { authState, user } = useAuth();

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-700" />
      </div>
    );
  }

  if (authState !== "authenticated" || user?.email !== ADMIN_EMAIL) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
