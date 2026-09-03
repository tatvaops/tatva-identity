"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createGigPost, createJobPost } from "@/lib/actions/opportunity";
import type { Organisation } from "@/lib/types/identity";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

export function JobCreateForm({ organisations }: { organisations: Organisation[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (organisations.length === 0) {
    return (
      <Card className="p-5 text-sm">
        Create an organisation first. Jobs are posted from a business passport, not a personal profile.
      </Card>
    );
  }
  return (
    <Card className="mx-auto max-w-xl space-y-4 p-5">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await createJobPost({
              organisationId: String(form.get("organisationId") ?? ""),
              title: String(form.get("title") ?? ""),
              city: String(form.get("city") ?? ""),
              employmentType: String(form.get("employmentType") ?? "permanent"),
              experienceLabel: String(form.get("experienceLabel") ?? ""),
              salaryLabel: String(form.get("salaryLabel") ?? ""),
              skills: String(form.get("skills") ?? ""),
              description: String(form.get("description") ?? ""),
            });
            if (!result.ok) setError(result.error);
          });
        }}
      >
        <Field label="Organisation">
          <select name="organisationId" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Job title">
          <Input name="title" required />
        </Field>
        <Field label="City">
          <Input name="city" />
        </Field>
        <Field label="Employment type">
          <select name="employmentType" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="part_time">Part time</option>
            <option value="temporary">Temporary</option>
            <option value="internship">Internship</option>
          </select>
        </Field>
        <Field label="Experience">
          <Input name="experienceLabel" />
        </Field>
        <Field label="Compensation label">
          <Input name="salaryLabel" placeholder="Public range only. Do not add payroll data." />
        </Field>
        <Field label="Skills">
          <Input name="skills" placeholder="Comma separated" />
        </Field>
        <Field label="Overview">
          <Textarea name="description" rows={6} />
        </Field>
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          Publish job
        </Button>
      </form>
    </Card>
  );
}

export function GigCreateForm({ organisations }: { organisations: Organisation[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (organisations.length === 0) {
    return (
      <Card className="p-5 text-sm">
        Create an organisation first. Gigs are posted from a business passport.
      </Card>
    );
  }
  return (
    <Card className="mx-auto max-w-xl space-y-4 p-5">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await createGigPost({
              organisationId: String(form.get("organisationId") ?? ""),
              title: String(form.get("title") ?? ""),
              siteName: String(form.get("siteName") ?? ""),
              trade: String(form.get("trade") ?? ""),
              shiftLabel: String(form.get("shiftLabel") ?? ""),
              payLabel: String(form.get("payLabel") ?? ""),
              startLabel: String(form.get("startLabel") ?? ""),
              seats: String(form.get("seats") ?? ""),
              duration: String(form.get("duration") ?? "1_shift"),
              description: String(form.get("description") ?? ""),
            });
            if (!result.ok) setError(result.error);
          });
        }}
      >
        <Field label="Organisation">
          <select name="organisationId" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gig title">
          <Input name="title" required />
        </Field>
        <Field label="Site or city">
          <Input name="siteName" />
        </Field>
        <Field label="Trade">
          <Input name="trade" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="When">
            <Input name="startLabel" placeholder="Tomorrow, 8am" />
          </Field>
          <Field label="Shift">
            <Input name="shiftLabel" />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pay label">
            <Input name="payLabel" />
          </Field>
          <Field label="Seats">
            <Input name="seats" inputMode="numeric" />
          </Field>
        </div>
        <Field label="Duration">
          <select name="duration" className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
            <option value="4_hours">4 hours</option>
            <option value="1_shift">1 shift</option>
            <option value="1_day">1 day</option>
            <option value="3_days">3 days</option>
            <option value="1_week">1 week</option>
            <option value="project">Project</option>
          </select>
        </Field>
        <Field label="Details">
          <Textarea name="description" rows={5} />
        </Field>
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={pending}>
          Publish gig
        </Button>
      </form>
    </Card>
  );
}
