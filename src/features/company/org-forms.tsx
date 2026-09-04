"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addOrganisationCredential, addOrganisationService, createOrganisation, inviteOrganisationMember, updateOrganisation, writeOrganisationReview } from "@/lib/actions/organisation";
import { uploadPublicImage } from "@/lib/actions/media";
import { organisationTypes } from "@/lib/domain/workspace-schemas";
import type { Organisation } from "@/lib/types/identity";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function OrganisationForm({ org }: { org?: Organisation }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="mx-auto max-w-xl space-y-4 p-5">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const input = {
            name: String(form.get("name") ?? ""),
            tagline: String(form.get("tagline") ?? ""),
            about: String(form.get("about") ?? ""),
            type: String(form.get("type") ?? "employer"),
            industry: String(form.get("industry") ?? ""),
            city: String(form.get("city") ?? ""),
            locality: String(form.get("locality") ?? ""),
            foundedYear: String(form.get("foundedYear") ?? ""),
            website: String(form.get("website") ?? ""),
            publicPhone: String(form.get("publicPhone") ?? ""),
            publicEmail: String(form.get("publicEmail") ?? ""),
            officeLocality: String(form.get("officeLocality") ?? ""),
            serviceAreas: String(form.get("serviceAreas") ?? ""),
            teamSizeLabel: String(form.get("teamSizeLabel") ?? ""),
            state: String(form.get("state") ?? ""),
          };
          start(async () => {
            const result = org ? await updateOrganisation(org.slug, input) : await createOrganisation(input);
            if (!result.ok) setError(result.error);
          });
        }}
      >
        <Field label="Organisation name">
          <Input name="name" required defaultValue={org?.name} />
        </Field>
        <Field label="Tagline">
          <Input name="tagline" defaultValue={org?.tagline ?? ""} />
        </Field>
        <Field label="About">
          <Textarea name="about" rows={5} defaultValue={org?.about ?? ""} />
        </Field>
        <Field label="Type">
          <select name="type" defaultValue={org?.type ?? "employer"} className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
            {organisationTypes.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Industry">
          <Input name="industry" defaultValue={org?.industry ?? ""} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="City">
            <Input name="city" defaultValue={org?.city ?? ""} />
          </Field>
          <Field label="Locality">
            <Input name="locality" defaultValue={org?.locality ?? ""} />
          </Field>
        </div>
        <Field label="Founded year">
          <Input name="foundedYear" inputMode="numeric" defaultValue={org?.foundedYear ? String(org.foundedYear) : ""} />
        </Field>
        <Field label="Website">
          <Input name="website" defaultValue={org?.website ?? ""} />
        </Field>
        <Field label="Public phone">
          <Input name="publicPhone" defaultValue={org?.publicPhone ?? ""} />
        </Field>
        <Field label="Public email">
          <Input name="publicEmail" type="email" defaultValue={org?.publicEmail ?? ""} />
        </Field>
        <Field label="Workplace locality (never home)">
          <Input name="officeLocality" defaultValue={org?.officeLocality ?? ""} />
        </Field>
        <Field label="Service areas">
          <Input name="serviceAreas" defaultValue={org?.serviceAreas.join(", ") ?? ""} placeholder="Comma separated" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Team size">
            <Input name="teamSizeLabel" defaultValue={org?.teamSizeLabel ?? ""} />
          </Field>
          <Field label="State">
            <Input name="state" defaultValue={org?.state ?? ""} />
          </Field>
        </div>
        {org ? <OrganisationLogoUpload slug={org.slug} /> : null}
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {org ? "Save organisation" : "Create organisation"}
        </Button>
      </form>
    </Card>
  );
}

export function OrganisationCatalogueForms({ organisationId }: { organisationId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Add a service</p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              const result = await addOrganisationService({
                organisationId,
                name: String(form.get("name") ?? ""),
                description: String(form.get("description") ?? ""),
                locations: String(form.get("locations") ?? ""),
                pricingModel: String(form.get("pricingModel") ?? ""),
              });
              if (!result.ok) setError(result.error);
              else event.currentTarget.reset();
            });
          }}
        >
          <Input name="name" placeholder="Service name" required />
          <Input name="locations" placeholder="Locations, comma separated" />
          <Input name="pricingModel" placeholder="Pricing model" />
          <Textarea name="description" rows={3} placeholder="What you provide" />
          <Button type="submit" disabled={pending} size="sm">
            Add service
          </Button>
        </form>
      </Card>
      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">Add a public credential state</p>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              const result = await addOrganisationCredential({
                organisationId,
                name: String(form.get("name") ?? ""),
                category: String(form.get("category") ?? ""),
              });
              if (!result.ok) setError(result.error);
              else event.currentTarget.reset();
            });
          }}
        >
          <Input name="name" placeholder="Credential name" required />
          <Input name="category" placeholder="Category, e.g. gst" required />
          <Button type="submit" disabled={pending} size="sm">
            Add credential
          </Button>
        </form>
      </Card>
      {error ? (
        <p className="text-sm text-rose-700 md:col-span-2" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function OrganisationLogoUpload({ slug }: { slug: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Field label="Logo">
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={pending}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const data = new FormData();
          data.set("file", file);
          data.set("kind", "org-logo");
          data.set("slug", slug);
          start(async () => {
            const result = await uploadPublicImage(data);
            if (!result.ok) setError(result.error);
          });
        }}
      />
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </Field>
  );
}

export function OrganisationInviteForm({ organisationId }: { organisationId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">Invite a member</p>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await inviteOrganisationMember({
              organisationId,
              handle: String(form.get("handle") ?? ""),
              roleTitle: String(form.get("roleTitle") ?? ""),
              department: String(form.get("department") ?? ""),
              orgRole: String(form.get("orgRole") ?? "member"),
              visibility: String(form.get("visibility") ?? "public"),
            });
            if (!result.ok) setError(result.error);
            else event.currentTarget.reset();
          });
        }}
      >
        <Input name="handle" placeholder="Profile handle" required />
        <Input name="roleTitle" placeholder="Role title" />
        <Input name="department" placeholder="Department" />
        <select name="orgRole" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
          <option value="member">Member</option>
          <option value="recruiter">Recruiter</option>
          <option value="admin">Admin</option>
        </select>
        <select name="visibility" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} size="sm">
          Send invite
        </Button>
      </form>
    </Card>
  );
}

export function OrganisationReviewForm({ organisationId }: { organisationId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-semibold">Write a review</p>
      <p className="text-xs text-muted-foreground">Only for work you actually shared with this organisation.</p>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await writeOrganisationReview({
              organisationId,
              rating: Number.parseInt(String(form.get("rating") ?? "5"), 10),
              body: String(form.get("body") ?? ""),
              relationship: String(form.get("relationship") ?? "verified_client"),
            });
            if (!result.ok) setError(result.error);
            else event.currentTarget.reset();
          });
        }}
      >
        <label className="block text-sm">
          Rating
          <select name="rating" className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
            <option value="5">5</option>
            <option value="4">4</option>
            <option value="3">3</option>
            <option value="2">2</option>
            <option value="1">1</option>
          </select>
        </label>
        <select name="relationship" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
          <option value="verified_client">Verified client</option>
          <option value="verified_employer">Verified employer</option>
        </select>
        <Textarea name="body" rows={4} placeholder="What happened on the work" required />
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending} size="sm">
          Publish review
        </Button>
      </form>
    </Card>
  );
}
