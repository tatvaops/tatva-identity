export function SkeletonPulse({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-secondary ${className ?? ""}`} />;
}

export function CardSkeleton() {
  return (
    <div className="surface-card p-4" aria-hidden>
      <div className="flex gap-3">
        <SkeletonPulse className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-1/2" />
          <SkeletonPulse className="h-3 w-3/4" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
      <SkeletonPulse className="h-44 w-full rounded-2xl" />
      <SkeletonPulse className="h-16 w-full" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <SkeletonPulse className="h-40 w-full" />
          <SkeletonPulse className="h-56 w-full" />
        </div>
        <SkeletonPulse className="hidden h-48 lg:block" />
      </div>
    </div>
  );
}

export function CompanySkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading organisation">
      <SkeletonPulse className="h-44 w-full rounded-2xl" />
      <SkeletonPulse className="h-72 w-full" />
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading project">
      <SkeletonPulse className="h-52 w-full rounded-2xl" />
      <SkeletonPulse className="h-40 w-full" />
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading feed">
      <SkeletonPulse className="h-24 w-full" />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading directory">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
