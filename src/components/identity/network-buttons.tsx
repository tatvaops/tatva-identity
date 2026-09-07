"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";
import { requestConnection, toggleFollowOrganisation, toggleFollowPerson } from "@/lib/actions/network";

export function ConnectionButton({
  profileId,
  initialState = "connect",
  size = "default",
  returnTo = "/people",
  className,
}: {
  profileId: string;
  initialState?: "connect" | "pending" | "incoming" | "connected";
  size?: "default" | "sm";
  returnTo?: string;
  className?: string;
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!userId) {
    if (size === "sm") return null;
    return (
      <Button size={size} variant="outline" className={className} asChild>
        <Link href={`/auth/sign-in?next=${encodeURIComponent(returnTo)}`}>Sign in to connect</Link>
      </Button>
    );
  }
  if (userId === profileId) return null;

  if (initialState === "connected") {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        <UserCheck /> Connected
      </Button>
    );
  }
  if (initialState === "incoming") {
    return (
      <Button size={size} variant="outline" className={className} asChild>
        <Link href="/network?tab=pending">Respond</Link>
      </Button>
    );
  }
  if (initialState === "pending") {
    return (
      <Button
        size={size}
        variant="outline"
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const { withdrawConnection } = await import("@/lib/actions/network");
            const result = await withdrawConnection(profileId);
            if (result.ok) router.refresh();
          })
        }
      >
        <Clock /> Withdraw
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        className={className}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await requestConnection(profileId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setError(null);
            router.refresh();
          })
        }
      >
        <UserPlus /> Connect
      </Button>
      {error ? (
        <p className="basis-full text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function FollowButton({
  personId,
  organisationId,
  following = false,
  size = "default",
  returnTo = "/people",
  className,
}: {
  personId?: string;
  organisationId?: string;
  following?: boolean;
  size?: "default" | "sm";
  returnTo?: string;
  className?: string;
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!userId) {
    return (
      <Button size={size} variant="outline" className={className} asChild>
        <Link href={`/auth/sign-in?next=${encodeURIComponent(returnTo)}`}>Sign in to follow</Link>
      </Button>
    );
  }
  if (personId && userId === personId) return null;

  return (
    <Button
      size={size}
      variant={following ? "secondary" : "outline"}
      className={className}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = personId
            ? await toggleFollowPerson(personId, following)
            : organisationId
              ? await toggleFollowOrganisation(organisationId, following)
              : { ok: false as const, error: "Missing target" };
          if (result.ok) router.refresh();
        })
      }
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
