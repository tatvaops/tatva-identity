"use client";

import Link from "next/link";
import { useTransition } from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/growth";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/types/identity";

const GROUPS = [
  { id: "messages", label: "Messages", match: (kind: string) => /message/i.test(kind) },
  { id: "network", label: "Network", match: (kind: string) => /connect|follow|network|endors|recommend|org_invite/i.test(kind) },
  { id: "work", label: "Work", match: (kind: string) => /project|work|shift|ledger|comment|reaction/i.test(kind) },
  { id: "opportunities", label: "Opportunities", match: (kind: string) => /job|gig|hire|quote|opportunit|application/i.test(kind) },
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
  const [pending, start] = useTransition();
  const unread = items.filter((item) => !item.readAt).length;
  if (items.length === 0) {
    return (
      <EmptyState
        title="No notifications yet"
        body="Follows, connection requests, messages, applications and verification updates appear here when they happen in the database."
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
      {unread > 0 ? (
        <div className="flex justify-end">
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
      {order.map((id) => {
        const rows = grouped.get(id);
        if (!rows?.length) return null;
        const label = GROUPS.find((g) => g.id === id)?.label ?? "Updates";
        return (
          <section key={id}>
            <h2 className="mb-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</h2>
            <div className="space-y-2">
              {rows.map((n) => (
                <Link
                  key={n.id}
                  href={n.href || "/notifications"}
                  onClick={() => {
                    if (!n.readAt) start(async () => { await markNotificationRead(n.id); });
                  }}
                >
                  <Card className={cn("p-4", !n.readAt && "border-primary/30 bg-indigo-50/40")}>
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
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
