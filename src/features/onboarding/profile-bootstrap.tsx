"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { bootstrapOwnProfile } from "@/lib/actions/profile";

export function ProfileBootstrapRecovery() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-black tracking-tight text-[#111a42]">Your session is active</h1>
      <Card className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">
          You are signed in, but the professional passport row still needs to be created. This is not a sign-out.
          Retry passport setup without leaving this session.
        </p>
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await bootstrapOwnProfile();
              if (!result.ok) {
                setError(result.error);
                return;
              }
              router.refresh();
            })
          }
        >
          Create passport and continue
        </Button>
      </Card>
    </div>
  );
}
