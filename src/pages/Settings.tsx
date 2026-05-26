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
import { getLinkedProviders, linkGoogle, linkGithub } from "../services/auth";

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
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-card/90 backdrop-blur-sm flex-shrink-0">
      <Link
        to="/dashboard"
        className="font-heading text-sm font-semibold tracking-tight text-foreground hover:text-primary transition-colors flex-shrink-0"
      >
        OneSheet
      </Link>

      <div className="w-px h-5 bg-border flex-shrink-0" aria-hidden />

      <span className="text-sm font-medium text-foreground flex-1">
        Settings
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {user?.username && (
          <a
            href={`/${user.username}`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors hidden sm:inline"
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
        className="mt-3 text-xs text-muted-foreground hover:text-primary transition-colors"
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
        : "text-muted-foreground";

  return (
    <div className="mt-3 border-t border-border pt-3">
      <label htmlFor="new-username" className="text-xs font-medium text-muted-foreground">
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
          className="flex-1 rounded-md border border-input px-2.5 py-1.5 text-sm font-mono outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
        <button
          type="button"
          disabled={saving || checkStatus !== "available"}
          onClick={handleSave}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          className="text-xs text-muted-foreground hover:text-foreground"
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
      <p className="text-xs text-muted-foreground mt-0.5">
        Old profile links will automatically redirect to your new username.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Linked Accounts
// ---------------------------------------------------------------------------

function LinkedAccounts() {
  const [providers, setProviders] = React.useState<string[]>([]);
  const [linking, setLinking] = React.useState<string | null>(null);
  const toast = useToast();

  React.useEffect(() => {
    setProviders(getLinkedProviders());
  }, []);

  const hasGoogle = providers.includes("google.com");
  const hasGithub = providers.includes("github.com");
  const hasPassword = providers.includes("password");

  async function handleLink(provider: "google" | "github") {
    setLinking(provider);
    try {
      if (provider === "google") await linkGoogle();
      else await linkGithub();
      setProviders(getLinkedProviders());
      toast.success(`${provider === "google" ? "Google" : "GitHub"} account linked!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to link account.";
      if (msg.includes("already-in-use")) {
        toast.error("That account is already linked to a different user.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLinking(null);
    }
  }

  const rows: { id: string; label: string; linked: boolean; action?: "google" | "github" }[] = [
    { id: "password", label: "Email / Password", linked: hasPassword },
    { id: "google", label: "Google", linked: hasGoogle, action: "google" },
    { id: "github", label: "GitHub", linked: hasGithub, action: "github" },
  ];

  return (
    <div className="bg-card rounded-lg border border-input p-4 max-w-lg">
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <span className="text-sm text-foreground">{row.label}</span>
            {row.linked ? (
              <span className="text-xs text-green-600 font-medium">Linked</span>
            ) : row.action ? (
              <button
                type="button"
                disabled={linking !== null}
                onClick={() => handleLink(row.action!)}
                className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {linking === row.action ? "Linking..." : "Link"}
              </button>
            ) : (
              <span className="text-xs text-muted-foreground">-</span>
            )}
          </li>
        ))}
      </ul>
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
    <div className="flex flex-col min-h-screen bg-background">
      <SettingsNav />

      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
        {showSuccessBanner && (
          <div className="flex items-start justify-between gap-2 p-4 mb-6 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
            <p className="font-medium">
              Welcome to Pro! Your subscription is being activated. This may take a moment.
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

        <h1 className="text-lg font-semibold text-foreground mb-6">Account Settings</h1>

        {/* Profile section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Profile
          </h2>
          <div className="bg-card rounded-lg border border-input p-4 max-w-lg">
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
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.displayName || "-"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                {user?.username && (
                  <p className="text-xs text-primary truncate">
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

        {/* Linked Accounts section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Linked Accounts
          </h2>
          <LinkedAccounts />
        </section>

        {/* Billing section */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Billing
          </h2>
          <SubscriptionCard
            pollOnMount={checkoutParam === "success"}
            onSubscriptionActive={handleSubscriptionActive}
          />
        </section>

        {/* API section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
            API
          </h2>
          <ApiKeysCard />
        </section>
      </main>
    </div>
  );
}
