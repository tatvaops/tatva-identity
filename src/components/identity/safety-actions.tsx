"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { reportEntity, toggleBlock } from "@/lib/actions/network";

export function ReportEntityButton({
  entityKind,
  entityId,
  label = "Report",
}: {
  entityKind: "post" | "profile" | "organisation" | "job" | "gig" | "project";
  entityId: string;
  label?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Report this {entityKind}</DialogTitle>
          <DialogDescription>
            Reports go to IDENTITI operators. Do not include private documents or unverified accusations.
          </DialogDescription>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              start(async () => {
                const result = await reportEntity(entityKind, entityId, reason);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                setReason("");
                router.refresh();
              });
            }}
          >
            <label className="block text-sm">
              <span className="font-medium">Why are you reporting this?</span>
              <Textarea
                className="mt-1"
                required
                minLength={4}
                maxLength={280}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                aria-invalid={Boolean(error)}
              />
            </label>
            {error ? (
              <p className="text-sm text-rose-700" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={pending || reason.trim().length < 4}>
              {pending ? "Sending…" : "Submit report"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BlockPersonButton({
  personId,
  blocked,
}: {
  personId: string;
  blocked?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-start">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await toggleBlock(personId, Boolean(blocked));
            if (!result.ok) setError(result.error);
            else router.refresh();
          })
        }
      >
        {blocked ? "Unblock" : "Block"}
      </Button>
      {error ? (
        <span className="text-xs text-rose-700" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
