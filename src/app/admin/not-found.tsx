export default function AdminNotFound() {
  return (
    <div className="rounded-xl border border-border bg-white px-6 py-12 text-center">
      <h1 className="text-lg font-semibold">Not in this console</h1>
      <p className="mt-2 text-sm text-muted-foreground">That record is missing, or you do not have access to it.</p>
    </div>
  );
}
