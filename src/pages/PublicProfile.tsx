import * as React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { ProfileResume } from "../components/profile/ProfileResume";
import { ProfileActions } from "../components/profile/ProfileActions";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuth } from "../hooks/useAuth";
import type { ResumeStyles } from "../types/resume";

interface ProfileData {
  displayName: string;
  resumeHtml: string;
  templateId: string;
  paperSize: "us-letter" | "a4";
  scaleFactor: number;
  lastUpdated: string | null;
  showBranding: boolean;
  styles?: ResumeStyles;
}

// ---------------------------------------------------------------------------
// Minimal nav for public profile pages
// ---------------------------------------------------------------------------

function ProfileNav() {
  return (
    <header className="h-12 bg-card/90 backdrop-blur-sm border-b border-border flex items-center px-6">
      <Link to="/" className="hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="OneSheet" className="h-6" />
      </Link>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center py-8 gap-4">
      <Skeleton width={816} height={40} />
      <Skeleton width={816} height={1056} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 404 state
// ---------------------------------------------------------------------------

function ProfileNotFound() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4 py-24 text-center px-4">
      <p className="text-xl font-semibold text-foreground">
        This profile doesn't exist
      </p>
      <p className="text-muted-foreground">
        The username you're looking for hasn't been claimed yet.
      </p>
      <Link
        to="/sign-up"
        className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-600 transition-colors"
      >
        Create your own OneSheet
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = React.useState<ProfileData | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!username) return;

    let cancelled = false;

    async function fetchProfile() {
      setLoading(true);
      setNotFound(false);
      setData(null);

      // Check for username redirect before hitting the API
      try {
        const redirectDoc = await getDoc(doc(db, "usernameRedirects", username!.toLowerCase()));
        if (!cancelled && redirectDoc.exists()) {
          const newUsername = redirectDoc.data().redirectTo;
          navigate(`/${newUsername}`, { replace: true });
          return;
        }
      } catch {
        // Redirect check failed — continue with normal fetch
      }

      try {
        const apiBase =
          (import.meta.env as Record<string, string>).VITE_FUNCTIONS_URL ??
          `https://us-central1-${
            (import.meta.env as Record<string, string>)
              .VITE_FIREBASE_PROJECT_ID
          }.cloudfunctions.net/api`;

        const res = await fetch(
          `${apiBase}/api/profile/${encodeURIComponent(username!)}`
        );

        if (cancelled) return;

        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }

        const json: ProfileData = await res.json();
        if (cancelled) return;

        setData(json);
        document.title = `${json.displayName} | Resume | OneSheet`;
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
      document.title = "OneSheet";
    };
  }, [username]);

  const isOwner = !!user && user.username === username;
  const canDownload = isOwner && user?.subscription?.status === "active";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {(!data || data.showBranding) && <ProfileNav />}

      {loading && (
        <main className="flex-1 overflow-auto">
          <ProfileSkeleton />
        </main>
      )}

      {!loading && notFound && (
        <main className="flex-1 flex">
          <ProfileNotFound />
        </main>
      )}

      {!loading && data && (
        <main className="flex-1 overflow-auto">
          <ProfileResume
            resumeHtml={data.resumeHtml}
            templateId={data.templateId}
            paperSize={data.paperSize}
            scaleFactor={data.scaleFactor}
            styles={data.styles}
          />

          <ProfileActions
            username={username!}
            canDownload={canDownload}
          />

          {data.showBranding && (
            <footer className="text-xs text-muted-foreground text-center py-4">
              Built with{" "}
              <Link to="/" className="hover:text-primary transition-colors">
                OneSheet
              </Link>{" "}
              /{" "}
              <Link
                to="/sign-up"
                className="hover:text-primary transition-colors"
              >
                Create yours
              </Link>
            </footer>
          )}
        </main>
      )}
    </div>
  );
}
