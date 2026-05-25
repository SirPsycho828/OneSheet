import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { OverflowMenu } from "../components/ui/OverflowMenu";
import { SubscriptionCard } from "../components/settings/SubscriptionCard";
import { ApiKeysCard } from "../components/settings/ApiKeysCard";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

// ---------------------------------------------------------------------------
// Settings Nav
// ---------------------------------------------------------------------------

function SettingsNav() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  async function handleSignOut() {
    try {
      await signOut(auth);
      navigate("/sign-in");
    } catch {
      toast.error("Failed to sign out.");
    }
  }

  const menuItems = [
    {
      label: "Dashboard",
      onClick: () => navigate("/dashboard"),
    },
    {
      label: "Sign Out",
      onClick: handleSignOut,
      variant: "danger" as const,
    },
  ];

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-gray-200 bg-white flex-shrink-0">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="text-sm font-semibold tracking-tight text-gray-950 hover:text-brand-500 transition-colors flex-shrink-0"
      >
        BragSheet
      </Link>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden />

      {/* Page title */}
      <span className="text-sm font-medium text-gray-700 flex-1">
        Settings
      </span>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {user?.username && (
          <a
            href={`/${user.username}`}
            className="text-xs text-gray-500 hover:text-brand-500 transition-colors hidden sm:inline"
          >
            View profile
          </a>
        )}
        <OverflowMenu items={menuItems} triggerLabel="Settings menu" />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const checkoutParam = searchParams.get("checkout");
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(
    checkoutParam === "success"
  );

  // Clear the ?checkout= param from the URL once we've read it
  React.useEffect(() => {
    if (checkoutParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubscriptionActive() {
    // Reload the page so AuthContext picks up the updated Firestore user doc
    window.location.reload();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SettingsNav />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {/* Post-checkout success banner */}
        {showSuccessBanner && (
          <div className="flex items-start justify-between gap-2 p-4 mb-6 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
            <p className="font-medium">
              Welcome to Pro! Your subscription is being activated — this may take a moment.
            </p>
            <button
              type="button"
              onClick={() => setShowSuccessBanner(false)}
              className="text-green-600 hover:text-green-800 flex-shrink-0 leading-none text-base font-medium"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}

        <h1 className="text-lg font-semibold text-gray-900 mb-6">Account Settings</h1>

        {/* Profile section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Profile
          </h2>
          <div className="bg-white rounded-lg border border-gray-300 p-4 max-w-lg">
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-semibold text-sm">
                  {(user?.displayName ?? user?.email ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.displayName || "—"}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                {user?.username && (
                  <p className="text-xs text-brand-500 truncate">
                    @{user.username}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Billing section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            Billing
          </h2>
          <SubscriptionCard
            pollOnMount={checkoutParam === "success"}
            onSubscriptionActive={handleSubscriptionActive}
          />
        </section>

        {/* API section */}
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
            API
          </h2>
          <ApiKeysCard />
        </section>
      </main>
    </div>
  );
}
