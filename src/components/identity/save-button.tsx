"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleSavedItem } from "@/lib/actions/growth";

export function SaveButton({
  kind,
  id,
  saved,
}: {
  kind: "job" | "gig" | "organisation";
  id: string;
  saved: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await toggleSavedItem(kind, id, saved);
          if (result.ok) router.refresh();
        })
      }
    >
      <Bookmark className={saved ? "fill-current" : undefined} />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
