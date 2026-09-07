"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { createPrivateDocumentUrl, deletePrivateDocument, uploadPrivateDocument } from "@/lib/actions/media";

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
          <label className="block text-sm">
            <span className="font-medium">Label</span>
            <Input name="label" placeholder="Trade certificate, drawing set…" required className="mt-1" />
          </label>
          <label className="block text-sm">
            <span className="font-medium">File</span>
            <Input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required className="mt-1" />
          </label>
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
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-medium">{document.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(document.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const result = await createPrivateDocumentUrl(document.id);
                        if (!result.ok || !result.id) {
                          setError(result.ok ? "Could not open that document." : result.error);
                          return;
                        }
                        window.open(result.id, "_blank", "noopener,noreferrer");
                      })
                    }
                  >
                    Open
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const result = await deletePrivateDocument(document.id);
                        if (!result.ok) setError(result.error);
                        else {
                          setError(null);
                          router.refresh();
                        }
                      })
                    }
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
