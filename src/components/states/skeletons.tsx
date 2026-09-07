import { cn } from "@/lib/utils";

export function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-secondary", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="surface-card p-4" aria-hidden>
      <div className="flex gap-3">
        <SkeletonPulse className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonPulse className="h-4 w-1/2" />
          <SkeletonPulse className="h-3 w-3/4" />
          <SkeletonPulse className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-0" aria-busy="true" aria-label="Loading profile">
      <SkeletonPulse className="h-44 w-full rounded-none" />
      <div className="border border-t-0 border-border bg-white px-5 py-5">
        <div className="flex gap-4">
          <SkeletonPulse className="size-24 rounded-md" />
          <div className="flex-1 space-y-2 pt-2">
            <SkeletonPulse className="h-7 w-1/3" />
            <SkeletonPulse className="h-4 w-1/2" />
            <SkeletonPulse className="h-4 w-1/4" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-x border-b border-border sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-4">
            <SkeletonPulse className="h-3 w-16" />
            <SkeletonPulse className="mt-2 h-5 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CompanySkeleton() {
  return (
    <div className="space-y-0" aria-busy="true" aria-label="Loading organisation">
      <SkeletonPulse className="h-52 w-full rounded-none" />
      <div className="border border-t-0 border-border bg-white p-5">
        <SkeletonPulse className="h-8 w-1/3" />
        <SkeletonPulse className="mt-3 h-4 w-2/3" />
        <SkeletonPulse className="mt-6 h-24 w-full" />
      </div>
    </div>
  );
}

export function ProjectSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading project">
      <SkeletonPulse className="h-72 w-full rounded-none" />
      <SkeletonPulse className="h-8 w-1/2" />
      <SkeletonPulse className="h-20 w-full" />
    </div>
  );
}

export function JobSkeleton() {
  return (
    <div className="border border-border bg-white p-4" aria-hidden>
      <SkeletonPulse className="h-3 w-16" />
      <SkeletonPulse className="mt-2 h-5 w-2/3" />
      <SkeletonPulse className="mt-2 h-3 w-1/2" />
      <div className="mt-3 flex gap-2">
        <SkeletonPulse className="h-5 w-16" />
        <SkeletonPulse className="h-5 w-20" />
      </div>
    </div>
  );
}

export function FeedSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading feed">
      <SkeletonPulse className="h-16 w-full" />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function ConversationSkeleton() {
  return (
    <div className="grid h-[calc(100vh-12rem)] overflow-hidden border border-border bg-white lg:grid-cols-[300px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading messages">
      <div className="space-y-3 border-r border-border p-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="hidden space-y-3 p-5 lg:block">
        <SkeletonPulse className="h-5 w-40" />
        <SkeletonPulse className="ml-auto h-10 w-1/2" />
        <SkeletonPulse className="h-10 w-2/3" />
      </div>
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-2" aria-busy="true" aria-label="Loading notifications">
      <SkeletonPulse className="h-16 w-full" />
      <SkeletonPulse className="h-16 w-full" />
      <SkeletonPulse className="h-16 w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden border border-border bg-white" aria-busy="true" aria-label="Loading table">
      <SkeletonPulse className="h-10 w-full rounded-none" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonPulse key={i} className="mt-px h-12 w-full rounded-none" />
      ))}
    </div>
  );
}

export function DirectorySkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading directory">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading search results">
      <SkeletonPulse className="h-10 w-full" />
      <DirectorySkeleton />
    </div>
  );
}
