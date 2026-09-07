"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileHandle } from "@/lib/actions/profile";
import { normalizeHandle } from "@/lib/domain/onboarding";

export function HandleForm({ current }: { current: string }) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await updateProfileHandle(normalizeHandle(value));
          if (!result.ok) {
            setError(result.error);
            return;
          }
          setError(null);
          router.refresh();
        });
      }}
    >
      <Input value={value} onChange={(event) => setValue(normalizeHandle(event.target.value))} aria-label="Public handle" />
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        Save handle
      </Button>
    </form>
  );
}
