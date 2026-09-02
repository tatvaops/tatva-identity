"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { UserPlus, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/providers/session-provider";
import { requestConnection, toggleFollowOrganisation, toggleFollowPerson } from "@/lib/actions/network";

export function ConnectionButton({
  profileId,
  initialState = "connect",
  size = "default",
}: {
  profileId: string;
  initialState?: "connect" | "pending" | "connected";
  size?: "default" | "sm";
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!userId) {
    return (
      <Button size={size} variant="outline" asChild>
        <Link href={`/auth/sign-in?next=/people`}>Sign in to connect</Link>
      </Button>
    );
  }
  if (userId === profileId) return null;

  if (initialState === "connected") {
    return (
      <Button size={size} variant="secondary" disabled>
        <UserCheck /> Connected
      </Button>
    );
  }
  if (initialState === "pending") {
    return (
      <Button size={size} variant="outline" disabled>
        <Clock /> Pending
      </Button>
    );
  }

  return (
    <Button
      size={size}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await requestConnection(profileId);
          if (result.ok) router.refresh();
        })
      }
    >
      <UserPlus /> Connect
    </Button>
  );
}

export function FollowButton({
  personId,
  organisationId,
  following = false,
  size = "default",
}: {
  personId?: string;
  organisationId?: string;
  following?: boolean;
  size?: "default" | "sm";
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!userId) {
    return (
      <Button size={size} variant="outline" asChild>
        <Link href="/auth/sign-in">Sign in to follow</Link>
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={following ? "secondary" : "outline"}
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
