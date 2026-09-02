"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/components/providers/session-provider";
import { updateProfileAbout } from "@/lib/actions/network";

export function ProfileEditDialogs() {
  const { profile } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!profile) return null;
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit profile
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>Edit about</DialogTitle>
          <DialogDescription>Only fields you save are stored. Nothing is invented.</DialogDescription>
          <form
            className="mt-4 space-y-3"
            action={(formData) =>
              start(async () => {
                const result = await updateProfileAbout(formData);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                router.refresh();
              })
            }
          >
            <Input name="headline" defaultValue={profile.headline ?? ""} placeholder="Headline" />
            <Textarea name="about" defaultValue={profile.about ?? ""} placeholder="About" />
            {error && <p className="text-sm text-rose-700">{error}</p>}
            <Button type="submit" disabled={pending}>
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
