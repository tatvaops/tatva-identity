"use client";

import { Button } from "@/components/ui/button";

export function ProfileShareButton({ handle }: { handle: string }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const url = `${window.location.origin}/people/${handle}`;
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
