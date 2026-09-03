import { CardSkeleton, SkeletonPulse } from "@/components/states/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <SkeletonPulse className="h-8 w-48" />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
