import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { getGig, getJob } from "@/lib/data/network";
import { listMyGigApplications, listMyJobApplications } from "@/lib/data/workspace";

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
      <p className="text-sm text-muted-foreground">Jobs and gigs you have applied to.</p>
      {rows.length === 0 ? (
        <EmptyState title="No applications yet" body="When you apply, they will be listed here." />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
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
                  <td className="px-4 py-3">{row.status.replaceAll("_", " ")}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
