"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export function OwnerDeleteButton({
  label,
  onDelete,
}: {
  label?: string;
  onDelete: () => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await onDelete();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
      >
        {label ?? "Remove"}
      </Button>
      {error ? (
        <span className="text-xs text-rose-700" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
