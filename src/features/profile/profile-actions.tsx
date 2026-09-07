"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConnectionButton, FollowButton } from "@/components/identity/network-buttons";
import { removeConnection, toggleBlock, toggleMute } from "@/lib/actions/network";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HireBoundary } from "@/features/profile/hire-boundary";
import { ProfileEditors } from "@/features/profile/profile-edit";
import { ProfileShareButton } from "@/features/profile/profile-share";
import { ReportEntityButton } from "@/components/identity/safety-actions";
import { isOpenToWork } from "@/lib/domain/availability";
import { personMessageHref, personPublicHref } from "@/lib/domain/identiti-routes";
import type { PublicProfile } from "@/lib/types/identity";

export function ProfileActionBar({
  profile,
  connectionState,
  following,
  hireLabel,
  isOwner,
  signedIn,
  muted = false,
  blocked = false,
  layout = "header",
}: {
  profile: PublicProfile;
  connectionState: "connect" | "pending" | "incoming" | "connected";
  following: boolean;
  hireLabel: string;
  isOwner: boolean;
  signedIn: boolean;
  muted?: boolean;
  blocked?: boolean;
  layout?: "header" | "mobile";
}) {
  const router = useRouter();
  const [overflowError, setOverflowError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const publicHref = personPublicHref(profile.handle, profile.occupationMode);
  const messageHref = personMessageHref(profile.id, signedIn, publicHref);
  const showHire = !isOwner && isOpenToWork(profile.availabilityStatus);
  const primary = connectionState === "connected" ? "message" : "connect";

  if (isOwner) {
    return (
      <div className="flex flex-wrap gap-2">
        {layout === "header" ? <ProfileEditors profile={profile} canEdit /> : null}
        <Button
          variant="outline"
          size={layout === "mobile" ? "default" : "sm"}
          className={layout === "mobile" ? "flex-1" : undefined}
          asChild
        >
          <Link href="/passport">Passport</Link>
        </Button>
        <ProfileShareButton handle={profile.handle} />
      </div>
    );
  }

  if (layout === "mobile") {
    return (
      <div className="flex gap-2">
        {primary === "connect" ? (
          <div className="min-w-0 flex-1 [&_a]:w-full [&_button]:w-full">
            <ConnectionButton profileId={profile.id} initialState={connectionState} returnTo={publicHref} />
          </div>
        ) : (
          <Button className="flex-1" asChild>
            <Link href={messageHref}>Message</Link>
          </Button>
        )}
        {showHire ? (
          <div className="min-w-0 flex-1">
            <HireBoundary label={hireLabel} fullWidth />
          </div>
        ) : primary === "connect" ? (
          <Button className="flex-1" variant="outline" asChild>
            <Link href={messageHref}>Message</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
        {primary === "connect" ? (
          <ConnectionButton profileId={profile.id} initialState={connectionState} returnTo={publicHref} />
        ) : null}
      <Button variant={primary === "message" ? "default" : "outline"} asChild>
        <Link href={messageHref}>Message</Link>
      </Button>
      {showHire ? <HireBoundary label={hireLabel} /> : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More profile actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-1 py-1">
            <FollowButton personId={profile.id} following={following} size="sm" returnTo={publicHref} />
          </div>
          {connectionState === "connected" ? (
            <DropdownMenuItem
              disabled={pending}
              onSelect={() =>
                start(async () => {
                  const result = await removeConnection(profile.id);
                  if (!result.ok) setOverflowError(result.error);
                  else router.refresh();
                })
              }
            >
              Remove connection
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem
            disabled={pending}
            onSelect={() =>
              start(async () => {
                const result = await toggleMute(profile.id, muted);
                if (!result.ok) setOverflowError(result.error);
                else router.refresh();
              })
            }
          >
            {muted ? "Unmute" : "Mute"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={pending}
            onSelect={() =>
              start(async () => {
                const result = await toggleBlock(profile.id, blocked);
                if (!result.ok) setOverflowError(result.error);
                else router.refresh();
              })
            }
          >
            {blocked ? "Unblock" : "Block"}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={publicHref}>View public profile</Link>
          </DropdownMenuItem>
          {signedIn ? (
            <div className="px-1 py-1">
              <ReportEntityButton entityKind="profile" entityId={profile.id} />
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileShareButton handle={profile.handle} />
      {overflowError ? (
        <p className="basis-full text-sm text-rose-700" role="alert">
          {overflowError}
        </p>
      ) : null}
    </div>
  );
}
