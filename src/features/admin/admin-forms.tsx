"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGrantOperator,
  adminReviewVerification,
  adminSetCertificationState,
  adminSetOrgCredentialState,
} from "@/lib/admin/actions";

export function AdminGrantForm() {
  const router = useRouter();
  const [handle, setHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="max-w-md space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const result = await adminGrantOperator(handle);
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            setHandle("");
            router.refresh();
          }
        });
      }}
    >
      <div className="flex gap-2">
        <Input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          placeholder="profile handle"
          aria-label="Profile handle"
        />
        <Button type="submit" disabled={pending}>
          {pending ? "Granting…" : "Grant access"}
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function AdminReviewForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (approve: boolean) => {
    start(async () => {
      const result = await adminReviewVerification({ requestId, approve, note });
      if (!result.ok) setError(result.error);
      else {
        setError(null);
        router.refresh();
      }
    });
  };
  return (
    <div className="space-y-2">
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Reviewer note (optional)"
        className="min-h-16"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => run(true)}>
          Approve
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => run(false)}>
          Decline
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const CERT_STATES = ["verified", "pending", "expired", "revoked", "not_submitted", "self_declared"] as const;
const ORG_CRED_STATES = ["verified", "pending", "expired", "not_submitted"] as const;

export function AdminCertificationState({ id, current }: { id: string; current: string }) {
  return <AdminStateSelect id={id} current={current} options={CERT_STATES} action={adminSetCertificationState} />;
}

export function AdminOrgCredentialState({ id, current }: { id: string; current: string }) {
  return <AdminStateSelect id={id} current={current} options={ORG_CRED_STATES} action={adminSetOrgCredentialState} />;
}

function AdminStateSelect({
  id,
  current,
  options,
  action,
}: {
  id: string;
  current: string;
  options: readonly string[];
  action: (id: string, state: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-1">
      <select
        className="h-8 rounded-lg border border-input bg-white px-2 text-xs"
        defaultValue={current}
        disabled={pending}
        aria-label="Credential state"
        onChange={(event) => {
          const state = event.target.value;
          start(async () => {
            const result = await action(id, state);
            if (!result.ok) setError(result.error);
            else {
              setError(null);
              router.refresh();
            }
          });
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
