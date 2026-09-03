import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/types/identity";

const GROUPS = [
  { id: "network", label: "Network", match: (kind: string) => /connect|follow|network|endors/i.test(kind) },
  { id: "work", label: "Work", match: (kind: string) => /project|work|shift|ledger/i.test(kind) },
  { id: "opportunities", label: "Opportunities", match: (kind: string) => /job|gig|hire|quote|opportunit/i.test(kind) },
  {
    id: "verification",
    label: "Verification",
    match: (kind: string) => /verif|passport|kyc|identity/i.test(kind),
  },
  { id: "credentials", label: "Credentials", match: (kind: string) => /credential|certif|licence|license/i.test(kind) },
] as const;

function groupFor(kind: string) {
  return GROUPS.find((group) => group.match(kind))?.id ?? "updates";
}

export function NotificationsView({ items }: { items: NotificationRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        body="Connection requests, verifications, jobs and gigs will show here when they happen."
      />
    );
  }

  const grouped = new Map<string, NotificationRow[]>();
  for (const item of items) {
    const key = groupFor(item.kind);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  const order = [...GROUPS.map((g) => g.id), "updates"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {order.map((id) => {
        const rows = grouped.get(id);
        if (!rows?.length) return null;
        const label = GROUPS.find((g) => g.id === id)?.label ?? "Updates";
        return (
          <section key={id}>
            <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</h2>
            <div className="space-y-2">
              {rows.map((n) => (
                <Link key={n.id} href={n.href || "/notifications"}>
                  <Card className={cn("p-4", !n.readAt && "border-primary/30 bg-indigo-50/40")}>
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
