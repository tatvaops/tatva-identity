"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { PersonCard } from "@/components/cards/entity-cards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { startJobConversation } from "@/lib/actions/messaging";
import { updateGigApplicationStatus, updateJobApplicationStatus } from "@/lib/actions/opportunity";
import type { OpportunityApplication } from "@/lib/types/identity";

export function ApplicationsView({
  kind,
  applications,
  jobId,
}: {
  kind: "job" | "gig";
  applications: OpportunityApplication[];
  jobId?: string;
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
          <p className="text-xs text-muted-foreground">Status: {application.status.replaceAll("_", " ")}</p>
          <div className="flex flex-wrap gap-2">
            {["submitted", "shortlisted", kind === "gig" ? "accepted" : "hired", "rejected"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={application.status === status ? "default" : "outline"}
                disabled={pending}
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
                {status}
              </Button>
            ))}
            {kind === "job" && jobId && application.profileId ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await startJobConversation(jobId, application.profileId);
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
