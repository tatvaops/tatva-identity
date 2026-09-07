"use client";

import { Button } from "@/components/ui/button";

export function ProfileShareButton({ handle, occupationMode }: { handle: string; occupationMode?: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const path = occupationMode === "blue_collar" || occupationMode === "contractor" ? `/gig-workers/${handle}` : `/professionals/${handle}`;
        const url = `${window.location.origin}${path}`;
        if (navigator.share) {
          await navigator.share({ url, title: "Professional profile" }).catch(() => undefined);
          return;
        }
        await navigator.clipboard.writeText(url);
      }}
    >
      Share
    </Button>
  );
}
