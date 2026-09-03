"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { ConnectionButton, FollowButton } from "@/components/identity/network-buttons";
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
import { isOpenToWork } from "@/lib/domain/availability";
import type { PublicProfile } from "@/lib/types/identity";

export function ProfileActionBar({
  profile,
  connectionState,
  following,
  hireLabel,
  isOwner,
  signedIn,
  layout = "header",
}: {
  profile: PublicProfile;
  connectionState: "connect" | "pending" | "connected";
  following: boolean;
  hireLabel: string;
  isOwner: boolean;
  signedIn: boolean;
  layout?: "header" | "mobile";
}) {
  const messageHref = signedIn
    ? `/messages?person=${profile.id}`
    : `/auth/sign-in?next=/people/${profile.handle}`;
  const showHire = !isOwner && isOpenToWork(profile.availabilityStatus);
  const primary = connectionState === "connected" ? "message" : "connect";

  if (isOwner) {
    return (
      <div className="flex flex-wrap gap-2">
        {layout === "header" ? <ProfileEditors profile={profile} canEdit /> : null}
        <Button variant={layout === "mobile" ? "default" : "outline"} className={layout === "mobile" ? "flex-1" : undefined} asChild>
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
            <ConnectionButton profileId={profile.id} initialState={connectionState} />
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
        <ConnectionButton profileId={profile.id} initialState={connectionState} />
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
            <FollowButton personId={profile.id} following={following} size="sm" />
          </div>
          {connectionState === "connected" ? (
            <DropdownMenuItem disabled>Connected</DropdownMenuItem>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href={`/people/${profile.handle}`}>View public profile</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ProfileShareButton handle={profile.handle} />
    </div>
  );
}
