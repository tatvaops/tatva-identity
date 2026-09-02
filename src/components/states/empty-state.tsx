import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  className,
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={cn("surface-card px-6 py-12 text-center", className)}>
      <FolderOpen className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="surface-card border-rose-200 px-6 py-8 text-center" role="alert">
      <p className="text-sm font-semibold">Could not load this page</p>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function QueryNotice({ configured, error }: { configured: boolean; error: string | null }) {
  if (error) return <ErrorState message={error} />;
  if (!configured) {
    return (
      <p className="mb-4 text-xs text-muted-foreground">
        Live data requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then apply
        supabase/migrations.
      </p>
    );
  }
  return null;
}
