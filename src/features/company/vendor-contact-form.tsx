"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitVendorContact } from "@/lib/actions/messaging";
import { cn } from "@/lib/utils";

export function VendorContactForm({
  organisationId,
  organisationName,
  signedIn,
  signInHref,
  label = "Contact this vendor",
  intent = "contact",
  variant = "default",
  fullWidth,
}: {
  organisationId: string;
  organisationName: string;
  signedIn: boolean;
  signInHref: string;
  label?: string;
  intent?: "contact" | "request";
  variant?: "default" | "outline" | "secondary";
  fullWidth?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!signedIn) {
    return (
      <Button className={cn(fullWidth && "w-full")} variant={variant} asChild>
        <Link href={signInHref}>{label}</Link>
      </Button>
    );
  }
  return (
    <>
      <Button className={cn(fullWidth && "w-full")} variant={variant} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            This message stays on IDENTITI. Operators see it in Admin → Contacts. It does not create a Vertex quote or hire.
          </DialogDescription>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const body = String(form.get("body") ?? "");
              start(async () => {
                const result = await submitVendorContact({
                  organisationId,
                  body,
                  intent,
                });
                if (!result.ok) setError(result.error);
                else {
                  setError(null);
                  setOpen(false);
                  router.push(result.id ? `/messages?c=${result.id}` : "/messages");
                }
              });
            }}
          >
            <Textarea
              name="body"
              required
              minLength={8}
              placeholder={`Tell ${organisationName} what you need.`}
              aria-label="Message"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send to vendor"}
            </Button>
            {error ? (
              <p className="text-xs text-rose-700" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
