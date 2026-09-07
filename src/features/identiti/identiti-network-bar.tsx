"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { ConnectionButton, FollowButton } from "@/components/identity/network-buttons";
import { SaveButton } from "@/components/identity/save-button";
import { BlockPersonButton, ReportEntityButton } from "@/components/identity/safety-actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { personMessageHref, personPublicHref } from "@/lib/domain/identiti-routes";
import type { PublicProfile } from "@/lib/types/identity";

export function IdentitiNetworkBar({
  profile,
  connectionState,
  following,
  signedIn,
  isOwner,
  saved = false,
  blocked = false,
}: {
  profile: PublicProfile;
  connectionState: "connect" | "pending" | "incoming" | "connected";
  following: boolean;
  signedIn: boolean;
  isOwner: boolean;
  saved?: boolean;
  blocked?: boolean;
}) {
  if (isOwner) {
    return null;
  }

  const publicHref = personPublicHref(profile.handle, profile.occupationMode);
  const messageHref = personMessageHref(profile.id, signedIn, publicHref);

  return (
    <>
      <Button asChild>
        <Link href={messageHref}>{signedIn ? "Message" : "Sign in to message"}</Link>
      </Button>
      <ConnectionButton
        profileId={profile.id}
        initialState={connectionState}
        returnTo={publicHref}
      />
      <FollowButton personId={profile.id} following={following} returnTo={publicHref} />
      {signedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More profile actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-1 py-1">
              <SaveButton kind="profile" id={profile.id} saved={saved} className="w-full justify-start" />
            </div>
            <div className="px-1 py-1">
              <BlockPersonButton personId={profile.id} blocked={blocked} />
            </div>
            <div className="px-1 py-1">
              <ReportEntityButton entityKind="profile" entityId={profile.id} />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </>
  );
}
