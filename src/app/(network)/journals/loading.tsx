import { DirectorySkeleton, SkeletonPulse } from "@/components/states/skeletons";

export default function Loading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading site journals">
      <div className="space-y-2">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="h-9 w-64" />
        <SkeletonPulse className="h-4 w-full max-w-2xl" />
      </div>
      <DirectorySkeleton />
    </div>
  );
}
