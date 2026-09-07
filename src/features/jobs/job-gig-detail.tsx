"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import Link from "next/link";
import { CompanyCard, JobCard } from "@/components/cards/entity-cards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/components/providers/session-provider";
import { applyToGig, applyToJob } from "@/lib/actions/network";
import { closeGigPost, closeJobPost, reopenGigPost, reopenJobPost } from "@/lib/actions/opportunity";
import { SaveButton } from "@/components/identity/save-button";
import { applicationStatusLabel } from "@/lib/domain/application-lifecycle";
import type { GigPost, JobPost, Organisation } from "@/lib/types/identity";

export function JobDetail({
  job,
  organisation,
  similar,
  saved = false,
  canManage = false,
  appliedStatus = null,
}: {
  job: JobPost;
  organisation: Organisation | null;
  similar: JobPost[];
  saved?: boolean;
  canManage?: boolean;
  appliedStatus?: string | null;
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <article>
        <p className="type-micro text-brand">{organisation?.name ?? "Job"}</p>
        <h1 className="type-display mt-2 text-4xl">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant={job.closedAt ? "muted" : "success"}>{job.closedAt ? "Closed" : "Open"}</Badge>
          {appliedStatus && appliedStatus !== "withdrawn" ? (
            <Badge variant="primary">{applicationStatusLabel(appliedStatus)}</Badge>
          ) : null}
          {job.easyApply && !job.closedAt ? <Badge variant="outline">Easy apply</Badge> : null}
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          {[job.city, job.employmentType.replaceAll("_", " "), job.salaryLabel].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {job.closedAt ? (
            <p className="text-sm text-muted-foreground">This job is closed and is not accepting new applications.</p>
          ) : appliedStatus && appliedStatus !== "withdrawn" ? (
            <p className="text-sm text-muted-foreground">
              You applied. Status: {applicationStatusLabel(appliedStatus)}.{" "}
              <Link href="/applications" className="text-primary hover:underline">
                View applications
              </Link>
            </p>
          ) : userId ? (
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await applyToJob(job.id);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              {pending ? "Submitting…" : job.easyApply ? "Easy apply" : "Apply"}
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/auth/sign-in?next=/jobs/${job.id}`}>Sign in to apply</Link>
            </Button>
          )}
          {userId ? <SaveButton kind="job" id={job.id} saved={saved} /> : null}
          {canManage ? (
            <Button variant="outline" asChild>
              <Link href={`/jobs/${job.id}/edit`}>Edit job</Link>
            </Button>
          ) : null}
          {canManage ? (
            <Button variant="outline" asChild>
              <Link href={`/jobs/${job.id}/applications`}>Applications</Link>
            </Button>
          ) : null}
          {canManage && !job.closedAt ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await closeJobPost(job.id);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              Close job
            </Button>
          ) : null}
          {canManage && job.closedAt ? (
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const result = await reopenJobPost(job.id);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              Reopen job
            </Button>
          ) : null}
        </div>
        {error && (
          <p className="mt-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
        <div className="mt-8 space-y-6 text-sm leading-7 text-text-secondary">
          <section>
            <h2 className="text-[15px] font-semibold text-foreground">Overview</h2>
            <p className="mt-2">{job.description ?? "No overview yet."}</p>
          </section>
          {job.responsibilities.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold text-foreground">Responsibilities</h2>
              <ul className="mt-2 list-disc pl-5">
                {job.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {job.requirements.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold text-foreground">Requirements</h2>
              <ul className="mt-2 list-disc pl-5">
                {job.requirements.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {job.skills.length > 0 && (
            <section>
              <h2 className="text-[15px] font-semibold text-foreground">Skills</h2>
              <div className="mt-2 flex flex-wrap gap-1">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </section>
          )}
          {job.salaryLabel && (
            <section>
              <h2 className="text-[15px] font-semibold text-foreground">Compensation</h2>
              <p className="mt-2">{job.salaryLabel}</p>
            </section>
          )}
        </div>
      </article>
      <aside className="space-y-3">
        {organisation && (
          <div>
            <p className="mb-2 text-sm font-semibold">Organisation</p>
            <CompanyCard org={organisation} />
          </div>
        )}
        {similar.length > 0 && <p className="text-sm font-semibold">Other roles</p>}
        {similar.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </aside>
    </div>
  );
}

export function GigDetail({
  gig,
  organisation,
  saved = false,
  canManage = false,
  appliedStatus = null,
}: {
  gig: GigPost;
  organisation: Organisation | null;
  saved?: boolean;
  canManage?: boolean;
  appliedStatus?: string | null;
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const facts = [
    gig.startLabel ? { label: "When", value: gig.startLabel } : null,
    gig.shiftLabel ? { label: "Shift", value: gig.shiftLabel } : null,
    gig.duration ? { label: "Duration", value: gig.duration } : null,
    gig.siteName ? { label: "Location", value: gig.siteName } : null,
    gig.distanceKm != null ? { label: "Distance", value: `${gig.distanceKm} km` } : null,
    gig.payLabel ? { label: "Pay", value: gig.payLabel } : null,
    gig.seats != null ? { label: "Seats", value: String(gig.seats) } : null,
    gig.trade ? { label: "Trade", value: gig.trade } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  return (
    <article className="mx-auto max-w-2xl border-l-2 border-l-brand border-y border-r border-border bg-white p-6">
      <p className="type-micro text-brand">Gig</p>
      <h1 className="type-display mt-2 text-4xl">{gig.title}</h1>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant={gig.closedAt ? "muted" : "success"}>{gig.closedAt ? "Closed" : "Open"}</Badge>
        {appliedStatus && appliedStatus !== "withdrawn" ? (
          <Badge variant="primary">{applicationStatusLabel(appliedStatus)}</Badge>
        ) : null}
      </div>
      {organisation && (
        <Link href={`/org/${organisation.slug}`} className="mt-2 inline-block text-sm text-primary hover:underline">
          {organisation.name}
        </Link>
      )}
      {facts.length > 0 && (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-surface-muted px-3 py-2">
              <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{fact.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold">{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-4 text-sm leading-6">{gig.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {gig.closedAt ? (
          <p className="text-sm text-muted-foreground">This gig is closed and is not accepting new applications.</p>
        ) : appliedStatus && appliedStatus !== "withdrawn" ? (
          <p className="text-sm text-muted-foreground">
            You applied. Status: {applicationStatusLabel(appliedStatus)}.{" "}
            <Link href="/applications" className="text-primary hover:underline">
              View applications
            </Link>
          </p>
        ) : userId ? (
          <Button
            className="w-full sm:w-auto"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await applyToGig(gig.id);
                if (!result.ok) setError(result.error);
                else router.refresh();
              })
            }
          >
            {pending ? "Submitting…" : "Apply"}
          </Button>
        ) : (
          <Button className="w-full sm:w-auto" asChild>
            <Link href={`/auth/sign-in?next=/gigs/${gig.id}`}>Sign in to apply</Link>
          </Button>
        )}
        {userId ? <SaveButton kind="gig" id={gig.id} saved={saved} /> : null}
        {canManage ? (
          <Button variant="outline" asChild>
            <Link href={`/gigs/${gig.id}/edit`}>Edit gig</Link>
          </Button>
        ) : null}
        {canManage ? (
          <Button variant="outline" asChild>
            <Link href={`/gigs/${gig.id}/applications`}>Applications</Link>
          </Button>
        ) : null}
        {canManage && !gig.closedAt ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await closeGigPost(gig.id);
                if (!result.ok) setError(result.error);
                else router.refresh();
              })
            }
          >
            Close gig
          </Button>
        ) : null}
        {canManage && gig.closedAt ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await reopenGigPost(gig.id);
                if (!result.ok) setError(result.error);
                else router.refresh();
              })
            }
          >
            Reopen gig
          </Button>
        ) : null}
      </div>
      {error && (
        <p className="mt-2 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
