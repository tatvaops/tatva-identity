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
import { VendorContactForm } from "@/features/company/vendor-contact-form";
import { ReportEntityButton } from "@/components/identity/safety-actions";
import { SaveButton } from "@/components/identity/save-button";

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
  organisationName,
  slug,
  createdBy,
  following,
  signedIn,
  type,
  saved = false,
}: {
  organisationId: string;
  organisationName: string;
  slug: string;
  createdBy: string | null;
  following: boolean;
  signedIn: boolean;
  type: string;
  saved?: boolean;
}) {
  const showQuote = QUOTE_TYPES.has(type);
  const isOwner = Boolean(createdBy);
  const next = `/companies/${slug}`;
  const messageHref = signedIn ? `/messages?org=${slug}` : `/auth/sign-in?next=${encodeURIComponent(next)}`;
  return (
    <div className="flex flex-wrap gap-2">
      <FollowButton organisationId={organisationId} following={following} />
      {signedIn ? <SaveButton kind="organisation" id={organisationId} saved={saved} /> : null}
      {!isOwner ? (
        <VendorContactForm
          organisationId={organisationId}
          organisationName={organisationName}
          signedIn={signedIn}
          signInHref={`/auth/sign-in?next=${encodeURIComponent(next)}`}
          label={showQuote ? "Request this vendor" : "Contact this company"}
          intent={showQuote ? "request" : "contact"}
        />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More organisation actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {showQuote ? (
            <>
              <DropdownMenuItem asChild>
                <Link href={messageHref}>Message</Link>
              </DropdownMenuItem>
              <div className="p-1">
                <QuoteBoundary label="Vertex quote" variant="outline" fullWidth />
              </div>
            </>
          ) : (
            <div className="p-1">
              <QuoteBoundary label="Enquire" variant="outline" fullWidth />
            </div>
          )}
          {signedIn ? (
            <div className="p-1">
              <ReportEntityButton entityKind="organisation" entityId={organisationId} />
            </div>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
