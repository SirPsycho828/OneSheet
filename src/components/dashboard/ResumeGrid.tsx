import { Plus } from "lucide-react";
import { ResumeCard } from "./ResumeCard";
import { Skeleton } from "../ui/Skeleton";
import type { Resume } from "../../types/resume";
import type { Analytics } from "../../types/analytics";

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortOption = "updated" | "name" | "views";

function sortResumes(
  resumes: Resume[],
  analytics: Record<string, Analytics>,
  sortBy: SortOption
): Resume[] {
  const copy = [...resumes];
  switch (sortBy) {
    case "updated":
      return copy.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis?.() ?? 0;
        const bTime = b.updatedAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
    case "name":
      return copy.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );
    case "views":
      return copy.sort((a, b) => {
        const aViews = analytics[a.id]?.profileViews ?? 0;
        const bViews = analytics[b.id]?.profileViews ?? 0;
        return bViews - aViews;
      });
    default:
      return copy;
  }
}

// ---------------------------------------------------------------------------
// Skeleton cards for loading state
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col shadow-sm">
      {/* Thumbnail skeleton */}
      <div className="hidden sm:block w-full">
        <Skeleton height={337} className="w-full rounded-none" />
      </div>
      {/* Body skeleton */}
      <div className="p-4 flex flex-col gap-3">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="55%" />
        <Skeleton variant="text" width="45%" />
        <div className="flex gap-2 mt-2">
          <Skeleton height={36} className="flex-1 rounded-md" />
          <Skeleton height={36} width={36} className="rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder "add" card
// ---------------------------------------------------------------------------

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "bg-white rounded-lg border-2 border-dashed border-gray-300",
        "flex flex-col items-center justify-center gap-2 p-8",
        "text-gray-400 hover:text-gray-600 hover:border-gray-400",
        "transition-colors cursor-pointer min-h-[160px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
      ].join(" ")}
      aria-label="Create new resume"
    >
      <Plus className="w-8 h-8" strokeWidth={1.5} />
      <span className="text-sm font-medium">New resume</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-gray-500 text-base">No resumes yet.</p>
      <button
        type="button"
        onClick={onCreateClick}
        className="text-brand-500 hover:underline text-sm font-medium focus-visible:outline-none"
      >
        Create your first resume
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResumeGrid
// ---------------------------------------------------------------------------

interface ResumeGridProps {
  resumes: Resume[];
  analytics: Record<string, Analytics>;
  sortBy: SortOption;
  isLoading: boolean;
  resumeLimit: number;
  onCreateClick: () => void;
  onResumesChange: () => void;
}

export function ResumeGrid({
  resumes,
  analytics,
  sortBy,
  isLoading,
  resumeLimit,
  onCreateClick,
  onResumesChange,
}: ResumeGridProps) {
  const sorted = sortResumes(resumes, analytics, sortBy);
  const atLimit = resumes.length >= resumeLimit;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (resumes.length === 0) {
    return <EmptyState onCreateClick={onCreateClick} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map((resume) => (
        <ResumeCard
          key={resume.id}
          resume={resume}
          analytics={analytics[resume.id] ?? null}
          allResumes={resumes}
          onResumesChange={onResumesChange}
        />
      ))}
      {!atLimit && <AddCard onClick={onCreateClick} />}
    </div>
  );
}
