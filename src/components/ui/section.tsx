import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("type-micro text-brand", className)} {...props} />;
}

export function PageHeader({
  eyebrow,
  title,
  body,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 max-w-3xl">
        {eyebrow ? <Eyebrow className="mb-2">{eyebrow}</Eyebrow> : null}
        <h1 className="type-page sm:text-[2rem]">{title}</h1>
        {body ? <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{body}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
    </header>
  );
}

export function Section({
  eyebrow,
  title,
  action,
  children,
  className,
  boxed = false,
}: {
  eyebrow?: string;
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  boxed?: boolean;
}) {
  return (
    <section className={cn(boxed ? "surface-card p-5 sm:p-6" : "space-y-4", className)}>
      {title || action ? (
        <div className={cn("flex items-end justify-between gap-4", boxed && "mb-4")}>
          <div>
            {eyebrow ? <Eyebrow className="mb-1">{eyebrow}</Eyebrow> : null}
            {title ? <h2 className="type-section">{title}</h2> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-lg font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{label}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProofStrip({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  if (items.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-3 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="min-w-0 px-4 py-4 sm:px-5">
          <dt className="type-micro">{item.label}</dt>
          <dd className="mt-1.5 text-sm font-semibold tracking-tight">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MetaRow({ items, className }: { items: (string | null | undefined)[]; className?: string }) {
  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;
  return <p className={cn("type-meta", className)}>{visible.join(" · ")}</p>;
}
