"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  adminGrantOperator,
  adminLinkProductProject,
  adminMintCredential,
  adminReviewVerification,
  adminSaveAiReview,
  adminSaveBrandProduct,
  adminSaveForumLink,
  adminSetAiReviewSource,
  adminSetCertificationState,
  adminSetOrgCredentialState,
  adminAddProjectContributor,
  adminSavePerformance,
  adminSavePortfolioItem,
  adminSaveSkillFact,
  adminSaveStrength,
  adminSaveSupervisorReview,
  adminSaveVideo,
  adminSetOrganisationMedia,
  adminSetPassportKind,
  adminSetProfileMedia,
  adminSetProjectMedia,
} from "@/lib/admin/actions";
import { AdminMediaField } from "@/features/admin/admin-media-field";

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

function AdminFormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="text-xs text-rose-700" role="alert">
      {error}
    </p>
  );
}

export function AdminOrganisationMediaForm({
  organisationId,
  coverPath,
  logoPath,
  categoryLabel,
  servingRegions,
}: {
  organisationId: string;
  coverPath?: string | null;
  logoPath?: string | null;
  categoryLabel?: string | null;
  servingRegions?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminSetOrganisationMedia(organisationId, {
            coverPath: String(form.get("coverPath") ?? ""),
            logoPath: String(form.get("logoPath") ?? ""),
            categoryLabel: String(form.get("categoryLabel") ?? ""),
            servingRegions: String(form.get("servingRegions") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <AdminMediaField name="coverPath" label="Cover photo" defaultValue={coverPath} placeholder="https://… cover photo" />
      <AdminMediaField name="logoPath" label="Logo" defaultValue={logoPath} placeholder="https://… logo" />
      <Input name="categoryLabel" defaultValue={categoryLabel ?? ""} placeholder="Category label" aria-label="Category label" />
      <Input name="servingRegions" defaultValue={servingRegions ?? ""} placeholder="Serving regions" aria-label="Serving regions" />
      <Button type="submit" size="sm" disabled={pending}>
        Save brand media
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminProfileMediaForm({
  profileId,
  avatarPath,
  coverPath,
}: {
  profileId: string;
  avatarPath?: string | null;
  coverPath?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminSetProfileMedia(profileId, {
            avatarPath: String(form.get("avatarPath") ?? ""),
            coverPath: String(form.get("coverPath") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <AdminMediaField name="avatarPath" label="Portrait" defaultValue={avatarPath} placeholder="https://… portrait" />
      <AdminMediaField name="coverPath" label="Cover photo" defaultValue={coverPath} placeholder="https://… cover" />
      <Button type="submit" size="sm" disabled={pending}>
        Save profile photos
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminProjectMediaForm({
  projectId,
  coverImageUrl,
  youtubeUrl,
  qcNotes,
  testimonial,
  valueLabel,
}: {
  projectId: string;
  coverImageUrl?: string | null;
  youtubeUrl?: string | null;
  qcNotes?: string | null;
  testimonial?: string | null;
  valueLabel?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminSetProjectMedia(projectId, {
            coverImageUrl: String(form.get("coverImageUrl") ?? ""),
            youtubeUrl: String(form.get("youtubeUrl") ?? ""),
            qcNotes: String(form.get("qcNotes") ?? ""),
            testimonial: String(form.get("testimonial") ?? ""),
            valueLabel: String(form.get("valueLabel") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <AdminMediaField name="coverImageUrl" label="Project cover" defaultValue={coverImageUrl} placeholder="https://… project cover" />
      <Input name="youtubeUrl" defaultValue={youtubeUrl ?? ""} placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube URL" />
      <Input name="valueLabel" defaultValue={valueLabel ?? ""} placeholder="Value label" aria-label="Value label" />
      <Textarea name="qcNotes" defaultValue={qcNotes ?? ""} placeholder="QC notes" className="min-h-16" aria-label="QC notes" />
      <Textarea name="testimonial" defaultValue={testimonial ?? ""} placeholder="Client note" className="min-h-16" aria-label="Client note" />
      <Button type="submit" size="sm" disabled={pending}>
        Save project media
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminProductForm({
  organisationId,
  product,
}: {
  organisationId: string;
  product?: {
    id: string;
    slug: string;
    name: string;
    application_family: string;
    category: string | null;
    description: string | null;
    photo_url: string | null;
    indicative_price_label: string | null;
  };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminSaveBrandProduct({
            id: product?.id,
            organisationId,
            slug: String(form.get("slug") ?? ""),
            name: String(form.get("name") ?? ""),
            applicationFamily: String(form.get("applicationFamily") ?? ""),
            category: String(form.get("category") ?? ""),
            description: String(form.get("description") ?? ""),
            photoUrl: String(form.get("photoUrl") ?? ""),
            priceLabel: String(form.get("priceLabel") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <Input name="name" defaultValue={product?.name ?? ""} placeholder="Product name" aria-label="Product name" />
      <Input name="slug" defaultValue={product?.slug ?? ""} placeholder="slug" aria-label="Product slug" />
      <Input name="applicationFamily" defaultValue={product?.application_family ?? ""} placeholder="Application family" aria-label="Application family" />
      <Input name="category" defaultValue={product?.category ?? ""} placeholder="Category" aria-label="Category" />
      <AdminMediaField name="photoUrl" label="Product photo" defaultValue={product?.photo_url} placeholder="https://… product photo" />
      <Input name="priceLabel" defaultValue={product?.indicative_price_label ?? ""} placeholder="Indicative price" aria-label="Indicative price" />
      <Textarea name="description" defaultValue={product?.description ?? ""} placeholder="Description" className="min-h-16" aria-label="Description" />
      <Button type="submit" size="sm" disabled={pending}>
        {product ? "Update product" : "Add product"}
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminAiReviewBodyForm({
  organisationId,
  sourceKind,
  sourceLabel,
  summary,
  sourceCount,
  sourceHref,
}: {
  organisationId: string;
  sourceKind?: string | null;
  sourceLabel?: string | null;
  summary?: string | null;
  sourceCount?: number | null;
  sourceHref?: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminSaveAiReview({
            organisationId,
            sourceKind: form.get("sourceKind") === "google_reviews" ? "google_reviews" : "vantage_forum",
            sourceLabel: String(form.get("sourceLabel") ?? ""),
            summary: String(form.get("summary") ?? ""),
            sourceCount: Number(form.get("sourceCount") ?? 0),
            sourceHref: String(form.get("sourceHref") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <select name="sourceKind" defaultValue={sourceKind ?? "vantage_forum"} className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Source kind">
        <option value="vantage_forum">Vantage Forum discussions</option>
        <option value="google_reviews">Google Reviews</option>
      </select>
      <Input name="sourceLabel" defaultValue={sourceLabel ?? ""} placeholder="Source label" aria-label="Source label" />
      <Input name="sourceCount" type="number" min={0} defaultValue={sourceCount ?? 0} aria-label="Source count" />
      <Input name="sourceHref" defaultValue={sourceHref ?? ""} placeholder="/forums or https://…" aria-label="Source href" />
      <Textarea name="summary" defaultValue={summary ?? ""} placeholder="Labelled summary. Say when this is demonstration data." className="min-h-24" aria-label="AI review summary" />
      <Button type="submit" size="sm" disabled={pending}>
        Save labelled pulse
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminProductUseForm({
  products,
  projects,
}: {
  products: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (products.length === 0 || projects.length === 0) {
    return <p className="text-sm text-muted-foreground">Add a product and a linked project before recording application proof.</p>;
  }
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await adminLinkProductProject({
            productId: String(form.get("productId") ?? ""),
            projectId: String(form.get("projectId") ?? ""),
            application: String(form.get("application") ?? ""),
            location: String(form.get("location") ?? ""),
          });
          if (!result.ok) setError(result.error);
          else {
            setError(null);
            router.refresh();
          }
        });
      }}
    >
      <select name="productId" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Product">
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <select name="projectId" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Project">
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <Input name="application" placeholder="Application" aria-label="Application" />
      <Input name="location" placeholder="Location on project" aria-label="Location" />
      <Button type="submit" size="sm" disabled={pending}>
        Link product to project
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

function runForm(
  start: ReturnType<typeof useTransition>[1],
  setError: (value: string | null) => void,
  router: ReturnType<typeof useRouter>,
  action: () => Promise<{ ok: true } | { ok: false; error: string }>,
) {
  start(async () => {
    const result = await action();
    if (!result.ok) setError(result.error);
    else {
      setError(null);
      router.refresh();
    }
  });
}

export function AdminPassportKindForm({ organisationId, current }: { organisationId: string; current?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const kind = String(new FormData(event.currentTarget).get("kind"));
        runForm(start, setError, router, () =>
          adminSetPassportKind(organisationId, kind === "product_brand" || kind === "other" ? kind : "service_brand"),
        );
      }}
    >
      <select name="kind" defaultValue={current ?? "other"} className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Passport kind">
        <option value="service_brand">Service brand</option>
        <option value="product_brand">Product brand</option>
        <option value="other">Other company</option>
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        Save kind
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminPerformanceForm({
  organisationId,
  onTimePct,
  qualityRating,
  completedProjects,
  ongoingProjects,
}: {
  organisationId: string;
  onTimePct?: number | null;
  qualityRating?: number | null;
  completedProjects?: number | null;
  ongoingProjects?: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminSavePerformance(organisationId, {
            onTimePct: String(form.get("onTimePct") ?? ""),
            qualityRating: String(form.get("qualityRating") ?? ""),
            completedProjects: String(form.get("completedProjects") ?? ""),
            ongoingProjects: String(form.get("ongoingProjects") ?? ""),
          }),
        );
      }}
    >
      <Input name="onTimePct" type="number" defaultValue={onTimePct ?? ""} placeholder="On-time %" aria-label="On-time percent" />
      <Input name="qualityRating" type="number" step="0.1" defaultValue={qualityRating ?? ""} placeholder="Quality / 5" aria-label="Quality rating" />
      <Input name="completedProjects" type="number" defaultValue={completedProjects ?? ""} placeholder="Completed projects" aria-label="Completed projects" />
      <Input name="ongoingProjects" type="number" defaultValue={ongoingProjects ?? ""} placeholder="Ongoing projects" aria-label="Ongoing projects" />
      <Button type="submit" size="sm" disabled={pending} className="sm:col-span-2">
        Save performance
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminStrengthForm({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminSaveStrength(organisationId, String(form.get("title") ?? ""), String(form.get("metric") ?? ""), String(form.get("body") ?? "")),
        );
      }}
    >
      <Input name="title" placeholder="Strength title" aria-label="Strength title" />
      <Input name="metric" placeholder="Metric label" aria-label="Metric label" />
      <Textarea name="body" placeholder="Why this is public evidence" className="min-h-16" aria-label="Strength body" />
      <Button type="submit" size="sm" disabled={pending}>
        Add strength
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminVideoForm({ organisationId }: { organisationId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminSaveVideo(organisationId, String(form.get("title") ?? ""), String(form.get("youtubeUrl") ?? ""), String(form.get("duration") ?? "")),
        );
      }}
    >
      <Input name="title" placeholder="Showreel title" aria-label="Video title" />
      <Input name="youtubeUrl" placeholder="https://www.youtube.com/watch?v=…" aria-label="YouTube URL" />
      <Input name="duration" placeholder="Duration" aria-label="Duration" />
      <Button type="submit" size="sm" disabled={pending}>
        Add video
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminPortfolioForm({
  profileId,
  projects,
}: {
  profileId: string;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminSavePortfolioItem(profileId, {
            imageUrl: String(form.get("imageUrl") ?? ""),
            caption: String(form.get("caption") ?? ""),
            workCategory: String(form.get("workCategory") ?? ""),
            location: String(form.get("location") ?? ""),
            projectId: String(form.get("projectId") ?? ""),
          }),
        );
      }}
    >
      <AdminMediaField name="imageUrl" label="Work photo" placeholder="https://… work photo" />
      <Input name="caption" placeholder="Caption" aria-label="Caption" />
      <Input name="workCategory" placeholder="Category" aria-label="Work category" />
      <Input name="location" placeholder="Location" aria-label="Location" />
      <select name="projectId" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Linked project">
        <option value="">No linked project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" disabled={pending}>
        Add work photo
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminSupervisorReviewForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminSaveSupervisorReview(profileId, {
            reviewerName: String(form.get("reviewerName") ?? ""),
            designation: String(form.get("designation") ?? ""),
            companyName: String(form.get("companyName") ?? ""),
            body: String(form.get("body") ?? ""),
            rating: String(form.get("rating") ?? ""),
          }),
        );
      }}
    >
      <Input name="reviewerName" placeholder="Reviewer name" aria-label="Reviewer name" />
      <Input name="designation" placeholder="Designation" aria-label="Designation" />
      <Input name="companyName" placeholder="Company" aria-label="Company" />
      <Input name="rating" type="number" step="0.1" placeholder="Rating / 5" aria-label="Rating" />
      <Textarea name="body" placeholder="Review" className="min-h-16" aria-label="Review body" />
      <Button type="submit" size="sm" disabled={pending}>
        Add supervisor review
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminSkillFactForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminSaveSkillFact(profileId, {
            skillName: String(form.get("skillName") ?? ""),
            years: String(form.get("years") ?? ""),
            verifiedProjects: String(form.get("verifiedProjects") ?? ""),
            tools: String(form.get("tools") ?? ""),
          }),
        );
      }}
    >
      <Input name="skillName" placeholder="Skill name" aria-label="Skill name" />
      <Input name="years" type="number" placeholder="Years" aria-label="Years" />
      <Input name="verifiedProjects" type="number" placeholder="Verified projects" aria-label="Verified projects" />
      <Input name="tools" placeholder="Tools, comma separated" aria-label="Tools" />
      <Button type="submit" size="sm" disabled={pending}>
        Add skill fact
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}

export function AdminContributorForm({
  projects,
  people,
}: {
  projects: { id: string; name: string }[];
  people: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (projects.length === 0 || people.length === 0) {
    return <p className="text-sm text-muted-foreground">Need a project and a person before naming someone on delivered work.</p>;
  }
  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        runForm(start, setError, router, () =>
          adminAddProjectContributor(String(form.get("projectId") ?? ""), String(form.get("profileId") ?? ""), String(form.get("role") ?? "")),
        );
      }}
    >
      <select name="projectId" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Project">
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name}
          </option>
        ))}
      </select>
      <select name="profileId" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Person">
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name}
          </option>
        ))}
      </select>
      <Input name="role" placeholder="Role on this project" aria-label="Role" />
      <Button type="submit" size="sm" disabled={pending}>
        Name on project
      </Button>
      <AdminFormError error={error} />
    </form>
  );
}
