"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PersonCard } from "@/components/cards/entity-cards";
import { Button } from "@/components/ui/button";
import { acceptConnection, declineConnection } from "@/lib/actions/network";
import type { PendingConnection } from "@/lib/types/identity";

export function PendingConnections({ items }: { items: PendingConnection[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.id} className="space-y-2">
          <PersonCard profile={item.profile} connectionState="pending" />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await acceptConnection(item.id);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await declineConnection(item.id);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              Decline
            </Button>
          </div>
        </div>
      ))}
      {error ? (
        <p className="text-sm text-rose-700 sm:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
