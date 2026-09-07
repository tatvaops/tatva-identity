"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestRecommendation, requestRecommendationByHandle } from "@/lib/actions/growth";

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

export function AskRecommendationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const handle = String(new FormData(event.currentTarget).get("handle") ?? "");
        start(async () => {
          const result = await requestRecommendationByHandle(handle);
          if (!result.ok) setError(result.error);
          else {
            event.currentTarget.reset();
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <label className="block text-sm">
        <span className="font-medium">Ask a professional by handle</span>
        <Input name="handle" placeholder="public-handle" required className="mt-1" />
      </label>
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        Send request
      </Button>
    </form>
  );
}
