"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { uploadPrivateDocument } from "@/lib/actions/media";

export function DocumentVault({
  documents,
}: {
  documents: { id: string; label: string; createdAt: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-4">
      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Upload a private document</p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            start(async () => {
              const result = await uploadPrivateDocument(data);
              if (!result.ok) setError(result.error);
              else {
                setError(null);
                form.reset();
                router.refresh();
              }
            });
          }}
        >
          <Input name="label" placeholder="Label" required />
          <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required />
          {error ? (
            <p className="text-sm text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} size="sm">
            Upload
          </Button>
        </form>
      </Card>
      {documents.length === 0 ? (
        <EmptyState title="No documents yet" body="PDFs and images you upload stay private." />
      ) : (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{document.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
