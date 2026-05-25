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
import { Settings } from "./pages/Settings";


function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-3">
      <span className="text-lg font-semibold tracking-tight text-gray-950">BragSheet</span>
      <span className="text-6xl font-bold text-gray-200">404</span>
      <p className="text-gray-500">Page not found</p>
      <a
        href="/"
        className="mt-2 inline-flex items-center justify-center rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
      >
        Go to Homepage
      </a>
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
