"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requestRecommendation } from "@/lib/actions/growth";

export function RequestRecommendationButton({ toProfileId }: { toProfileId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await requestRecommendation({ toProfileId });
            if (!result.ok) setError(result.error);
            else {
              setError(null);
              router.refresh();
            }
          })
        }
      >
        Request recommendation
      </Button>
      {error ? (
        <p className="mt-1 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
