import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { publicErrorMessage } from "@/lib/public-error";

export function EmptyState({
  title,
  body,
  action,
  className,
}: Readonly<{
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={cn("border border-dashed border-border-strong bg-surface-muted/60 px-6 py-10 text-left", className)}
      role="status"
      aria-live="polite"
    >
      <p className="type-micro">{title}</p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-text-secondary">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Couldn't load this page",
  message,
  onRetry,
}: Readonly<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}>) {
  return (
    <div className="border border-border bg-white px-6 py-10" role="alert">
      <p className="type-section">{title}</p>
      <p className="mt-2 max-w-lg text-sm leading-6 text-text-secondary">{publicErrorMessage(message)}</p>
      {onRetry ? (
        <button type="button" className="mt-4 text-sm font-medium text-brand hover:underline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function QueryNotice({ configured, error }: Readonly<{ configured: boolean; error: string | null }>) {
  if (error) return <ErrorState message={error} />;
  if (!configured) {
    return (
      <p className="mb-4 text-sm text-muted-foreground" role="status" aria-live="polite">
        Live data requires Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then apply
        supabase/migrations.
      </p>
    );
  }
  return null;
}
