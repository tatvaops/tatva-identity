"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGrantOperator,
  adminMintCredential,
  adminReviewVerification,
  adminSaveForumLink,
  adminSetAiReviewSource,
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

export function AdminAiSourceForm({
  organisationId,
  source,
  enabled,
}: {
  organisationId: string;
  source: string;
  enabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminSetAiReviewSource(
            organisationId,
            form.get("source") === "google_reviews" ? "google_reviews" : "vantage_forum",
            form.get("enabled") === "on",
          );
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <select
        name="source"
        defaultValue={source || "vantage_forum"}
        className="h-9 w-full rounded-lg border border-input px-2 text-sm"
        aria-label="AI review source"
      >
        <option value="vantage_forum">Vantage Forum discussions</option>
        <option value="google_reviews">Google Reviews</option>
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={enabled} />
        Show labelled AI pulse
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        Save source
      </Button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}

export function AdminForumLinkForm({
  id,
  entityType,
  entityId,
  threadSlug,
  canonicalUrl,
  status,
}: {
  id?: string;
  entityType?: string;
  entityId?: string;
  threadSlug?: string;
  canonicalUrl?: string;
  status?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const nextStatus = form.get("status");
        start(async () => {
          const result = await adminSaveForumLink({
            id,
            entityType: String(form.get("entityType") ?? ""),
            entityId: String(form.get("entityId") ?? ""),
            threadSlug: String(form.get("threadSlug") ?? ""),
            canonicalUrl: String(form.get("canonicalUrl") ?? ""),
            status: nextStatus === "active" || nextStatus === "failed" ? nextStatus : "pending",
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <Input name="entityType" defaultValue={entityType} placeholder="service_brand | product_brand | product" aria-label="Entity type" />
      <Input name="entityId" defaultValue={entityId} placeholder="Entity UUID" aria-label="Entity id" />
      <Input name="threadSlug" defaultValue={threadSlug} placeholder="Vantage thread slug" aria-label="Thread slug" />
      <Input name="canonicalUrl" defaultValue={canonicalUrl} placeholder="https://vantage.withtatva.ai/forums/…" aria-label="Canonical URL" />
      <select name="status" defaultValue={status ?? "pending"} className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Status">
        <option value="pending">pending</option>
        <option value="active">active</option>
        <option value="failed">failed</option>
      </select>
      <Button type="submit" disabled={pending}>
        {id ? "Update mapping" : "Add mapping"}
      </Button>
      {error ? <p className="text-xs text-rose-700 md:col-span-2">{error}</p> : null}
    </form>
  );
}

export function AdminMintCredentialForm() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminMintCredential(String(form.get("name") ?? ""), form.get("kind") === "read" ? "read" : "write");
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            setToken("token" in result ? result.token ?? null : null);
            router.refresh();
          }
        });
      }}
    >
      <Input name="name" placeholder="Credential name" aria-label="Credential name" />
      <select name="kind" className="h-10 w-full rounded-lg border border-input px-2 text-sm" aria-label="Scope">
        <option value="write">Write (hubs, drafts, links)</option>
        <option value="read">Read (hubs, threads, summaries)</option>
      </select>
      <Button type="submit" disabled={pending}>
        Mint credential
      </Button>
      {token ? (
        <p className="break-all rounded-lg bg-muted p-3 text-xs">
          Copy now. The plaintext token is not stored: {token}
        </p>
      ) : null}
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </form>
  );
}
