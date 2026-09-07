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
    <div className="flex flex-wrap gap-3">
      <Button asChild className="rounded-xl bg-white font-bold text-[#111a42] hover:bg-white/90">
        <Link href={messageHref}>{signedIn ? "Message" : "Sign in to message"}</Link>
      </Button>
      <ConnectionButton
        profileId={profile.id}
        initialState={connectionState}
        returnTo={publicHref}
      />
      <FollowButton personId={profile.id} following={following} returnTo={publicHref} />
      {signedIn ? <SaveButton kind="profile" id={profile.id} saved={saved} /> : null}
      {signedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More profile actions" className="rounded-xl">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="px-1 py-1">
              <BlockPersonButton personId={profile.id} blocked={blocked} />
            </div>
            <div className="px-1 py-1">
              <ReportEntityButton entityKind="profile" entityId={profile.id} />
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
