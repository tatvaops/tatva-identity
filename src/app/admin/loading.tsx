import { CardSkeleton, SkeletonPulse } from "@/components/states/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading operations">
      <SkeletonPulse className="h-8 w-48" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
