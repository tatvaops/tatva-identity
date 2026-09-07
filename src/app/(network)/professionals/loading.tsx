import { CardSkeleton, SkeletonPulse } from "@/components/states/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading directory">
      <SkeletonPulse className="h-8 w-48" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
