import { JobSkeleton, SkeletonPulse } from "@/components/states/skeletons";

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading gigs">
      <div className="space-y-2">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="h-9 w-40" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => <JobSkeleton key={index} />)}
      </div>
    </div>
  );
}
