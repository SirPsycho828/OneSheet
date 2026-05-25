import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/ui/Toast";
import { PublicRoute } from "./components/auth/PublicRoute";
import { PrivateRoute } from "./components/auth/PrivateRoute";
import { OnboardingRoute } from "./components/auth/OnboardingRoute";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { Onboarding } from "./pages/Onboarding";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Editor } from "./pages/Editor";
import { Landing } from "./pages/Landing";
import { Privacy } from "./pages/Privacy";
import { Terms } from "./pages/Terms";
import { PublicProfile } from "./pages/PublicProfile";
import { Dashboard } from "./pages/Dashboard";

// ---------------------------------------------------------------------------
// Placeholder pages — will be replaced in later tasks
// ---------------------------------------------------------------------------

function Settings() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-600">Settings — coming soon</p>
    </div>
  );
}


function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <p className="text-gray-600">404 — Page not found</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ToastContainer />
          <Routes>
            {/* Public routes — redirect signed-in users */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<Landing />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />
            </Route>

            {/* Onboarding — only accessible to needs_onboarding state */}
            <Route element={<OnboardingRoute />}>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Email verification — accessible while unverified */}
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Private routes — require authenticated state */}
            <Route element={<PrivateRoute />}>
              <Route path="/editor" element={<Editor />} />
              <Route path="/editor/:resumeId" element={<Editor />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Static public pages */}
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Public profile catch-all — MUST be last */}
            <Route path="/:username" element={<PublicProfile />} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
