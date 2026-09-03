"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { writeRecommendation } from "@/lib/actions/growth";

export function RecommendForm({ toProfileId }: { toProfileId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await writeRecommendation({
            toProfileId,
            relationship: String(form.get("relationship") ?? ""),
            body: String(form.get("body") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            event.currentTarget.reset();
            router.refresh();
          }
        });
      }}
    >
      <Input name="relationship" placeholder="How you worked together" />
      <Textarea name="body" rows={3} placeholder="Write a recommendation from real work." required />
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        Add recommendation
      </Button>
    </form>
  );
}
