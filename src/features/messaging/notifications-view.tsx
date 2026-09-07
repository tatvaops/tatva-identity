"use client";

import Link from "next/link";
import { useTransition } from "react";
import { formatDistanceToNow, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/growth";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/types/identity";

function kindLabel(kind: string) {
  if (/message/i.test(kind)) return "Message";
  if (/connect|follow|network|endors|recommend|org_invite/i.test(kind)) return "Network";
  if (/job|gig|hire|quote|opportunit|application/i.test(kind)) return "Opportunity";
  if (/verif|passport|kyc|identity/i.test(kind)) return "Verification";
  if (/project|work|shift|ledger|comment|reaction/i.test(kind)) return "Work";
  return "Update";
}

export function NotificationsView({ items }: { items: NotificationRow[] }) {
  const [pending, start] = useTransition();
  const unread = items.filter((item) => !item.readAt).length;
  if (items.length === 0) {
    return (
      <EmptyState
        title="Notifications"
        body="Follows, connection requests, messages, applications and verification updates appear here when they happen in the database."
      />
    );
  }

  const today = items.filter((item) => isToday(new Date(item.createdAt)));
  const earlier = items.filter((item) => !isToday(new Date(item.createdAt)));

  return (
    <div className="mx-auto max-w-2xl">
      {unread > 0 ? (
        <div className="mb-4 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => start(async () => { await markAllNotificationsRead(); })}
          >
            Mark all as read
          </Button>
        </div>
      ) : null}
      <Group title="Today" rows={today} start={start} />
      <Group title="Earlier" rows={earlier} start={start} />
    </div>
  );
}

function Group({
  title,
  rows,
  start,
}: {
  title: string;
  rows: NotificationRow[];
  start: ReturnType<typeof useTransition>[1];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="mb-3 type-micro">{title}</h2>
      <ul className="divide-y divide-border border border-border bg-white">
        {rows.map((n) => (
          <li key={n.id}>
            <Link
              href={n.href || "/notifications"}
              className={cn("block px-4 py-4 hover:bg-surface-muted", !n.readAt && "bg-secondary/40")}
              onClick={() => {
                if (!n.readAt) start(async () => { await markNotificationRead(n.id); });
              }}
            >
              <p className="type-micro">{kindLabel(n.kind)}</p>
              <p className="mt-1 text-sm font-medium">{n.title}</p>
              {n.body ? <p className="mt-1 text-sm text-text-secondary">{n.body}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
