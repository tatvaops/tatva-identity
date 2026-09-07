"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import Link from "next/link";
import { PersonCard } from "@/components/cards/entity-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { startGigConversation, startJobConversation } from "@/lib/actions/messaging";
import { updateGigApplicationStatus, updateJobApplicationStatus, withdrawApplication } from "@/lib/actions/opportunity";
import { applicationStatusLabel, canApplicantWithdraw, canOperatorTransition, normalizeApplicationStatus, operatorApplicationStatuses } from "@/lib/domain/application-lifecycle";
import type { OpportunityApplication } from "@/lib/types/identity";

export function ApplicationsView({
  kind,
  applications,
  jobId,
  gigId,
}: {
  kind: "job" | "gig";
  applications: OpportunityApplication[];
  jobId?: string;
  gigId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (applications.length === 0) {
    return <EmptyState title="No applications yet" body="People who apply will appear here." />;
  }
  return (
    <div className="space-y-3">
      {applications.map((application) => (
        <Card key={application.id} className="space-y-3 p-4">
          {application.profile ? <PersonCard profile={application.profile} /> : <p className="text-sm">Applicant</p>}
          <p className="text-xs text-muted-foreground">Status: {applicationStatusLabel(application.status)}</p>
          <div className="flex flex-wrap gap-2">
            {operatorApplicationStatuses(kind).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={normalizeApplicationStatus(application.status) === status ? "default" : "outline"}
                disabled={pending || !canOperatorTransition(application.status, status)}
                onClick={() =>
                  start(async () => {
                    const result =
                      kind === "job"
                        ? await updateJobApplicationStatus({ id: application.id, status })
                        : await updateGigApplicationStatus({ id: application.id, status });
                    if (!result.ok) setError(result.error);
                    else router.refresh();
                  })
                }
              >
                {applicationStatusLabel(status)}
              </Button>
            ))}
            {(kind === "job" && jobId && application.profileId) || (kind === "gig" && gigId && application.profileId) ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result =
                      kind === "job" && jobId
                        ? await startJobConversation(jobId, application.profileId)
                        : gigId
                          ? await startGigConversation(gigId, application.profileId)
                          : { ok: false as const, error: "Missing conversation target" };
                    if (!result.ok) setError(result.error);
                    else if (result.id) router.push(`/messages?c=${result.id}`);
                  })
                }
              >
                Message applicant
              </Button>
            ) : null}
          </div>
        </Card>
      ))}
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function MyApplicationsTable({
  rows,
}: {
  rows: {
    id: string;
    kind: "job" | "gig";
    title: string;
    href: string;
    status: string;
    createdAt: string;
  }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <Link className="text-primary hover:underline" href={row.href}>
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{row.kind}</td>
                <td className="px-4 py-3">{applicationStatusLabel(row.status)}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {canApplicantWithdraw(row.status) ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const result = await withdrawApplication(row.kind, row.id);
                          if (!result.ok) setError(result.error);
                          else router.refresh();
                        })
                      }
                    >
                      Withdraw
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
