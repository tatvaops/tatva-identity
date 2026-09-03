"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { FollowButton } from "@/components/identity/network-buttons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuoteBoundary } from "@/features/company/quote-boundary";

const QUOTE_TYPES = new Set([
  "service_provider",
  "vendor",
  "subcontractor",
  "consultancy",
  "manufacturer",
  "staffing_agency",
]);

export function CompanyActionBar({
  organisationId,
  following,
  signedIn,
  type,
}: {
  organisationId: string;
  following: boolean;
  signedIn: boolean;
  type: string;
}) {
  const showQuote = QUOTE_TYPES.has(type);
  const messageHref = signedIn ? "/messages" : "/auth/sign-in";
  return (
    <div className="flex flex-wrap gap-2">
      <FollowButton organisationId={organisationId} following={following} />
      {showQuote ? <QuoteBoundary /> : (
        <Button variant="outline" asChild>
          <Link href={messageHref}>Message</Link>
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More organisation actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showQuote ? (
            <DropdownMenuItem asChild>
              <Link href={messageHref}>Message</Link>
            </DropdownMenuItem>
          ) : (
            <div className="p-1">
              <QuoteBoundary label="Enquire" variant="outline" fullWidth />
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
