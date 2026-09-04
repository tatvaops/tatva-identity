import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function adminDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

export function AdminStat({
  label,
  value,
  hint,
  href,
  tone,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  tone?: "default" | "warn" | "ok";
}) {
  const inner = (
    <Card className={cn("p-4", tone === "warn" && "border-amber-200", tone === "ok" && "border-emerald-200")}>
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return inner;
}

export function AdminHeader({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function AdminSearch({
  action,
  defaultValue,
  placeholder,
}: {
  action: string;
  defaultValue?: string;
  placeholder: string;
}) {
  return (
    <form action={action} className="mb-4 flex max-w-xl gap-2">
      <Input name="q" defaultValue={defaultValue} placeholder={placeholder} aria-label="Search" />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}

export function AdminPager({
  page,
  total,
  pageSize,
  href,
  query,
}: {
  page: number;
  total: number;
  pageSize: number;
  href: string;
  query?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const linkFor = (next: number) => {
    params.set("page", String(next));
    return `${href}?${params.toString()}`;
  };
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      {page > 1 ? (
        <Link href={linkFor(page - 1)} className="text-primary hover:underline">
          Previous
        </Link>
      ) : null}
      <span className="text-muted-foreground">
        Page {page} of {pages}
      </span>
      {page < pages ? (
        <Link href={linkFor(page + 1)} className="text-primary hover:underline">
          Next
        </Link>
      ) : null}
    </div>
  );
}

export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border bg-zinc-50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
