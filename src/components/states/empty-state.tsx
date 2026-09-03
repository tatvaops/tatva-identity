import type { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicErrorMessage } from "@/lib/public-error";

export function EmptyState({
  title,
  body,
  action,
  className,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card px-6 py-12 text-center", className)}>
      <FolderOpen className="mx-auto size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="surface-card border-rose-200 px-6 py-8 text-center" role="alert">
      <p className="text-sm font-semibold">Could not load this page</p>
      <p className="mt-1 text-sm text-muted-foreground">{publicErrorMessage(message)}</p>
      {onRetry ? (
        <button type="button" className="mt-4 text-sm font-medium text-primary hover:underline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function QueryNotice({ configured, error }: { configured: boolean; error: string | null }) {
  if (error) return <ErrorState message={error} />;
  if (!configured) {
    return (
      <p className="mb-4 text-sm text-muted-foreground">
        Live data requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then apply
        supabase/migrations.
      </p>
    );
  }
  return null;
}
