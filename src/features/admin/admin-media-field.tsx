"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { adminUploadPublicFile } from "@/lib/admin/create-actions";

export function AdminMediaField({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-1">
      <Input
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder ?? `https://… or upload ${label.toLowerCase()}`}
        aria-label={label}
      />
      <label className="text-xs text-muted-foreground">
        <span className="sr-only">Upload {label}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={pending}
          className="mt-1 block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1 file:text-xs"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const form = new FormData();
            form.set("file", file);
            start(async () => {
              const result = await adminUploadPublicFile(form);
              if (!result.ok) setError(result.error);
              else {
                setError(null);
                setValue(result.id ?? "");
              }
            });
          }}
        />
        {pending ? "Uploading…" : "Upload from this device (JPEG, PNG, WebP or GIF, under 5 MB)"}
      </label>
      {error ? (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
