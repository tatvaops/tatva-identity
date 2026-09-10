import { DirectorySkeleton, SkeletonPulse } from "@/components/states/skeletons";

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading search">
      <SkeletonPulse className="h-9 w-40" />
      <SkeletonPulse className="h-11 w-full" />
      <DirectorySkeleton />
    </div>
  );
}
