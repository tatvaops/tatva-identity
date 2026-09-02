import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/types/identity";

export function NotificationsView({ items }: { items: NotificationRow[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        body="Connection requests, verifications, jobs and gigs will show here when they happen."
      />
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-2">
      {items.map((n) => (
        <Link key={n.id} href={n.href || "/notifications"}>
          <Card className={cn("p-4", !n.readAt && "border-primary/30 bg-indigo-50/40")}>
            <p className="text-sm font-medium">{n.title}</p>
            <p className="text-sm text-muted-foreground">{n.body}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
