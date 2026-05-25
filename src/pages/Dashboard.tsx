import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Plus } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { Button } from "../components/ui/Button";
import { OverflowMenu } from "../components/ui/OverflowMenu";
import { ResumeGrid } from "../components/dashboard/ResumeGrid";
import { CreateResumeModal } from "../components/dashboard/CreateResumeModal";
import { getUserResumes } from "../services/resumes";
import { getAnalyticsForResumes } from "../services/analytics";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { FREE_RESUME_LIMIT, PRO_RESUME_LIMIT } from "../constants/pricing";
import type { Resume } from "../types/resume";
import type { Analytics } from "../types/analytics";

type SortOption = "updated" | "name" | "views";

const SORT_LABELS: Record<SortOption, string> = {
  updated: "Last updated",
  name: "Name",
  views: "Most viewed",
};

// ---------------------------------------------------------------------------
// Dashboard Nav
// ---------------------------------------------------------------------------

interface DashboardNavProps {
  onSignOut: () => void;
}

function DashboardNav({ onSignOut }: DashboardNavProps) {
  const { user } = useAuth();

  const menuItems = [
    {
      label: "Settings",
      onClick: () => {
        window.location.href = "/settings";
      },
    },
    {
      label: "Sign Out",
      onClick: onSignOut,
      variant: "danger" as const,
    },
  ];

  const profileUrl = user?.username
    ? `/${user.username}`
    : undefined;

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-gray-200 bg-white flex-shrink-0">
      {/* Logo — reloads dashboard */}
      <Link
        to="/dashboard"
        className="text-sm font-semibold tracking-tight text-gray-950 hover:text-brand-500 transition-colors flex-shrink-0"
      >
        BragSheet
      </Link>

      <div className="w-px h-5 bg-gray-200 flex-shrink-0" aria-hidden />

      {/* Page title */}
      <span className="text-sm font-medium text-gray-700 flex-1">
        My Resumes
      </span>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {profileUrl && (
          <a
            href={profileUrl}
            className="text-xs text-gray-500 hover:text-brand-500 transition-colors hidden sm:inline"
          >
            View profile
          </a>
        )}
        <OverflowMenu items={menuItems} triggerLabel="Dashboard menu" />
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Sort dropdown
// ---------------------------------------------------------------------------

interface SortDropdownProps {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className={[
          "appearance-none h-9 pl-3 pr-8 text-sm rounded-md",
          "border border-gray-300 bg-white text-gray-700",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
          "cursor-pointer",
        ].join(" ")}
        aria-label="Sort resumes"
      >
        {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
          <option key={opt} value={opt}>
            {SORT_LABELS[opt]}
          </option>
        ))}
      </select>
      <ChevronDown
        className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
        strokeWidth={1.5}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [resumes, setResumes] = React.useState<Resume[]>([]);
  const [analytics, setAnalytics] = React.useState<Record<string, Analytics>>(
    {}
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState<SortOption>("updated");
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  const resumeLimit =
    user?.subscription?.status === "active" ? PRO_RESUME_LIMIT : FREE_RESUME_LIMIT;
  const atLimit = resumes.length >= resumeLimit;

  // ---------------------------------------------------------------------------
  // Load resumes + analytics
  // ---------------------------------------------------------------------------

  const loadData = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userResumes = await getUserResumes(user.uid);
      setResumes(userResumes);

      const ids = userResumes.map((r) => r.id);
      if (ids.length > 0) {
        const analyticsMap = await getAnalyticsForResumes(ids);
        setAnalytics(analyticsMap);
      } else {
        setAnalytics({});
      }
    } catch {
      toast.error("Failed to load resumes.");
    } finally {
      setIsLoading(false);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  async function handleSignOut() {
    await signOut(auth);
    navigate("/sign-in");
  }

  function handleCreateClick() {
    if (atLimit) {
      toast.info(
        `You've reached the ${resumeLimit}-resume limit for your plan. Upgrade to create more.`
      );
      return;
    }
    setShowCreateModal(true);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <DashboardNav onSignOut={handleSignOut} />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8">
        {/* Top bar: create button + sort */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <Button
            variant="primary"
            onClick={handleCreateClick}
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            New Resume
          </Button>

          <SortDropdown value={sortBy} onChange={setSortBy} />
        </div>

        {/* Grid */}
        <ResumeGrid
          resumes={resumes}
          analytics={analytics}
          sortBy={sortBy}
          isLoading={isLoading}
          resumeLimit={resumeLimit}
          onCreateClick={handleCreateClick}
          onResumesChange={loadData}
        />
      </main>

      {/* Create modal */}
      <CreateResumeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
}
