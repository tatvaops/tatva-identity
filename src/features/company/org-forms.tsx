"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addOrganisationCredential, addOrganisationService, createOrganisation, updateOrganisation } from "@/lib/actions/organisation";
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
