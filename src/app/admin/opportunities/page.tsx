import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminCreateGigForm, AdminCreateJobForm } from "@/features/admin/admin-create-forms";
import { adminCloseGig, adminCloseJob } from "@/lib/admin/actions";
import { listAdminChoices, listAdminGigs, listAdminJobs } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Jobs & gigs" };

export default async function AdminOpportunitiesPage() {
  const [jobs, gigs, choices] = await Promise.all([listAdminJobs(), listAdminGigs(), listAdminChoices()]);
  return (
    <div>
      <AdminHeader
        title="Jobs & gigs"
        body="Publish a live listing or close one that should not stay public. This does not hire, quote, or staff a site."
      />
      <AdminCreateJobForm organisations={choices.organisations} />
      <AdminCreateGigForm organisations={choices.organisations} projects={choices.projects} />
      <h2 className="mb-3 text-lg font-semibold">Jobs</h2>
      {jobs.length === 0 ? (
        <EmptyState title="No jobs" body="Publish a job above. Open listings appear on the public jobs directory." />
      ) : (
        <AdminTable headers={["Job", "Organisation", "City", "Type", "State", "Created", "Actions"]}>
          {jobs.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                <Link href={`/jobs/${row.id}`} className="font-medium hover:text-primary">
                  {row.title}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{row.organisation?.name ?? "—"}</td>
              <td className="px-3 py-3 text-muted-foreground">{row.city ?? "—"}</td>
              <td className="px-3 py-3">{row.employment_type}</td>
              <td className="px-3 py-3">
                {row.closed_at ? <Badge variant="warning">Closed</Badge> : <Badge variant="success">Open</Badge>}
              </td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                <AdminActionButton
                  label={row.closed_at ? "Reopen" : "Close"}
                  action={adminCloseJob.bind(null, row.id, !row.closed_at)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Gigs</h2>
      {gigs.length === 0 ? (
        <EmptyState title="No gigs" body="Publish a gig above. Open listings appear on the public gigs directory." />
      ) : (
        <AdminTable headers={["Gig", "Organisation", "Trade", "Site", "State", "Created", "Actions"]}>
          {gigs.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                <Link href={`/gigs/${row.id}`} className="font-medium hover:text-primary">
                  {row.title}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{row.organisation?.name ?? "—"}</td>
              <td className="px-3 py-3">{row.trade}</td>
              <td className="px-3 py-3 text-muted-foreground">{row.site_name ?? "—"}</td>
              <td className="px-3 py-3">
                {row.closed_at ? <Badge variant="warning">Closed</Badge> : <Badge variant="success">Open</Badge>}
              </td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                <AdminActionButton
                  label={row.closed_at ? "Reopen" : "Close"}
                  action={adminCloseGig.bind(null, row.id, !row.closed_at)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
