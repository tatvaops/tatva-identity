"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import Link from "next/link";
import { CompanyCard, JobCard } from "@/components/cards/entity-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSession } from "@/components/providers/session-provider";
import { applyToGig, applyToJob } from "@/lib/actions/network";
import type { GigPost, JobPost, Organisation } from "@/lib/types/identity";

export function JobDetail({
  job,
  organisation,
  similar,
}: {
  job: JobPost;
  organisation: Organisation | null;
  similar: JobPost[];
}) {
  const { userId } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <Card className="p-6">
        <p className="text-xs text-muted-foreground">{organisation?.name}</p>
        <h1 className="mt-1 text-2xl font-semibold">{job.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {[job.city, job.salaryLabel, job.employmentType.replace("_", " ")].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-4 flex gap-2">
          {userId ? (
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
              Apply
            </Button>
          ) : (
            <Button asChild>
              <Link href={`/auth/sign-in?next=/jobs/${job.id}`}>Sign in to apply</Link>
            </Button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
        <article className="mt-6 space-y-4 text-sm leading-6">
          <p>{job.description}</p>
          {job.responsibilities.length > 0 && (
            <ul className="list-disc pl-5">
              {job.responsibilities.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
        </article>
      </Card>
      <aside className="space-y-3">
        {organisation && <CompanyCard org={organisation} />}
        {similar.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </aside>
    </div>
  );
}

export function GigDetail({ gig, organisation }: { gig: GigPost; organisation: Organisation | null }) {
  const { userId } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">{gig.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {[gig.siteName, gig.shiftLabel, gig.payLabel, gig.startLabel].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-3 text-sm">{gig.description}</p>
      {organisation && <p className="mt-2 text-sm">Organisation: {organisation.name}</p>}
      <div className="mt-4">
        {userId ? (
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await applyToGig(gig.id);
                if (!result.ok) setError(result.error);
                else router.refresh();
              })
            }
          >
            Accept gig
          </Button>
        ) : (
          <Button asChild>
            <Link href={`/auth/sign-in?next=/gigs/${gig.id}`}>Sign in to accept</Link>
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </Card>
  );
}
