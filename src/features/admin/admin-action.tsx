"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/shared";

export function AdminActionButton({
  label,
  action,
  confirm,
  variant = "outline",
}: {
  label: string;
  action: () => Promise<ActionResult>;
  confirm?: string;
  variant?: "outline" | "default" | "ghost" | "destructive";
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          start(async () => {
            const result = await action();
            if (!result.ok) setError(result.error);
            else {
              setError(null);
              router.refresh();
            }
          });
        }}
      >
        {pending ? "Working…" : label}
      </Button>
      {error ? (
        <span className="text-xs text-rose-700" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
