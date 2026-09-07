"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { respondToOrganisationInvite } from "@/lib/actions/organisation";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import type { Organisation } from "@/lib/types/identity";

export function OrganisationInvites({
  items,
}: {
  items: { id: string; roleTitle: string | null; organisation: Organisation }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (items.length === 0) return null;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-semibold">{item.organisation.name}</p>
            <p className="text-sm text-muted-foreground">{item.roleTitle || "Member invitation"}</p>
            <a className="text-xs text-primary hover:underline" href={brandPublicHref(item.organisation.passportKind, item.organisation.slug)}>
              View organisation
            </a>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await respondToOrganisationInvite({ membershipId: item.id, accept: true });
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
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await respondToOrganisationInvite({ membershipId: item.id, accept: false });
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              Decline
            </Button>
          </div>
        </Card>
      ))}
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
