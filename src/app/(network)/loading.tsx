export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
      <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
    </div>
  );
}
