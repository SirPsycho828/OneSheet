import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { OverflowMenu } from "../components/ui/OverflowMenu";
import { SubscriptionCard } from "../components/settings/SubscriptionCard";
import { ApiKeysCard } from "../components/settings/ApiKeysCard";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { checkUsernameAvailability, changeUsername } from "../services/usernames";

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
      <Link
        to="/dashboard"
        className="text-sm font-semibold tracking-tight text-gray-950 hover:text-brand-500 transition-colors flex-shrink-0"
      >
        BragSheet
      </Link>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden />

      <span className="text-sm font-medium text-gray-700 flex-1">
        Settings
      </span>

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
// Username Change
// ---------------------------------------------------------------------------

function UsernameChangeForm({
  currentUsername,
  uid,
  onChanged,
}: {
  currentUsername: string;
  uid: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [newUsername, setNewUsername] = React.useState("");
  const [checkStatus, setCheckStatus] = React.useState<
    "idle" | "checking" | "available" | "taken"
  >("idle");
  const [checkMsg, setCheckMsg] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const toast = useToast();

  let debounceTimer: ReturnType<typeof setTimeout>;

  function handleChange(value: string) {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setNewUsername(normalized);
    setCheckStatus("idle");
    setCheckMsg("");
    setError("");
    clearTimeout(debounceTimer);
    if (normalized.length >= 3 && normalized !== currentUsername) {
      debounceTimer = setTimeout(async () => {
        setCheckStatus("checking");
        const result = await checkUsernameAvailability(normalized);
        if (result.available) {
          setCheckStatus("available");
          setCheckMsg("Available!");
        } else {
          setCheckStatus("taken");
          setCheckMsg(result.reason);
        }
      }, 400);
    }
  }

  async function handleSave() {
    if (checkStatus !== "available" || !newUsername || newUsername === currentUsername) return;
    setSaving(true);
    setError("");
    try {
      await changeUsername(uid, currentUsername, newUsername);
      toast.success(`Username changed to @${newUsername}`);
      setEditing(false);
      setNewUsername("");
      setCheckStatus("idle");
      onChanged();
    } catch (err) {
      console.error("Username change error:", err);
      setError("Failed to change username. The name may have just been taken.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-3 text-xs text-gray-500 hover:text-brand-500 transition-colors"
      >
        Change username
      </button>
    );
  }

  const checkColor =
    checkStatus === "available"
      ? "text-green-600"
      : checkStatus === "taken"
        ? "text-red-600"
        : "text-gray-400";

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <label htmlFor="new-username" className="text-xs font-medium text-gray-600">
        New username
      </label>
      <div className="flex items-center gap-2 mt-1">
        <input
          id="new-username"
          type="text"
          value={newUsername}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={currentUsername}
          maxLength={30}
          className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-mono outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
        />
        <button
          type="button"
          disabled={saving || checkStatus !== "available"}
          onClick={handleSave}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setNewUsername("");
            setCheckStatus("idle");
            setError("");
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
      <p className={`text-xs mt-1 min-h-[1rem] ${checkColor}`}>
        {checkStatus === "checking"
          ? "Checking..."
          : checkMsg || "\u00A0"}
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <p className="text-xs text-gray-400 mt-0.5">
        Old profile links will automatically redirect to your new username.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

export function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();

  const checkoutParam = searchParams.get("checkout");
  const [showSuccessBanner, setShowSuccessBanner] = React.useState(
    checkoutParam === "success"
  );

  React.useEffect(() => {
    if (checkoutParam) {
      const next = new URLSearchParams(searchParams);
      next.delete("checkout");
      setSearchParams(next, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubscriptionActive() {
    window.location.reload();
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <SettingsNav />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
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
            {user?.username && user?.uid && (
              <UsernameChangeForm
                currentUsername={user.username}
                uid={user.uid}
                onChanged={refreshUser}
              />
            )}
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
