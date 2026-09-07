import { redirect } from "next/navigation";
import { EmptyState } from "@/components/states/empty-state";
import { MyApplicationsTable } from "@/features/jobs/applications-view";
import { getAuthContext } from "@/lib/data/query";
import { getGig, getJob } from "@/lib/data/network";
import { listMyGigApplications, listMyJobApplications } from "@/lib/data/workspace";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ApplicationsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/applications");
  const [jobs, gigs] = await Promise.all([
    listMyJobApplications(session.userId),
    listMyGigApplications(session.userId),
  ]);
  const rows = await Promise.all([
    ...jobs.data.map(async (application) => {
      const job = await getJob(application.entityId);
      return {
        id: application.id,
        kind: "job" as const,
        title: job.data?.title ?? "Job",
        href: `/jobs/${application.entityId}`,
        status: application.status,
        createdAt: application.createdAt,
      };
    }),
    ...gigs.data.map(async (application) => {
      const gig = await getGig(application.entityId);
      return {
        id: application.id,
        kind: "gig" as const,
        title: gig.data?.title ?? "Gig",
        href: `/gigs/${application.entityId}`,
        status: application.status,
        createdAt: application.createdAt,
      };
    }),
  ]);
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Applications</h1>
      <p className="text-sm text-muted-foreground">Jobs and gigs you have applied to. Status comes from the live application record.</p>
      {rows.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="When you apply to an open job or gig, it is stored here with its current status. IDENTITI does not record hiring."
          action={
            <Button asChild variant="outline">
              <Link href="/jobs">Browse jobs</Link>
            </Button>
          }
        />
      ) : (
        <MyApplicationsTable rows={rows} />
      )}
    </div>
  );
}
