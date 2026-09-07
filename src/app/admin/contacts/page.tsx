import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { listAdminGigApplications, listAdminJobApplications, listAdminVendorContacts } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Contacts" };

export default async function AdminContactsPage() {
  const [contacts, jobs, gigs] = await Promise.all([
    listAdminVendorContacts(),
    listAdminJobApplications(),
    listAdminGigApplications(),
  ]);
  return (
    <div>
      <AdminHeader
        title="Contacts & requests"
        body="When someone messages or requests a vendor on IDENTITI, it lands here. Job and gig applications are listed separately. This is not Vertex hire or quote fulfilment."
      />
      <h2 className="mb-3 text-lg font-semibold">Vendor contacts</h2>
      {contacts.length === 0 ? (
        <EmptyState
          title="No vendor contacts yet"
          body="Use Contact this vendor or Request this vendor on a brand page. Operators see the note here."
        />
      ) : (
        <AdminTable headers={["When", "From", "Vendor", "Kind", "Latest note"]}>
          {contacts.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.latestAt)}</td>
              <td className="px-3 py-3">
                {row.sender ? (
                  <Link href={`/admin/people/${row.sender.id}`} className="font-medium hover:text-primary">
                    {row.sender.full_name}
                  </Link>
                ) : (
                  "—"
                )}
                <p className="text-xs text-muted-foreground">@{row.sender?.handle}</p>
              </td>
              <td className="px-3 py-3">
                {row.organisation ? (
                  <Link href={`/admin/organisations/${row.organisation.id}`} className="hover:text-primary">
                    {row.organisation.name}
                  </Link>
                ) : (
                  row.title ?? "—"
                )}
              </td>
              <td className="px-3 py-3">
                <Badge variant="outline">{row.kind}</Badge>
              </td>
              <td className="max-w-sm px-3 py-3 text-muted-foreground">{row.latestBody ? row.latestBody.slice(0, 160) : "No message yet"}</td>
            </tr>
          ))}
        </AdminTable>
      )}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Job applications</h2>
      {jobs.length === 0 ? (
        <EmptyState title="No job applications" body="When someone applies to a job, the row appears here." />
      ) : (
        <AdminTable headers={["When", "Applicant", "Job", "Organisation", "Status"]}>
          {jobs.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                {row.person ? (
                  <Link href={`/admin/people/${row.person.id}`} className="font-medium hover:text-primary">
                    {row.person.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-3">{row.job ? <Link href={`/jobs/${row.job.id}`} className="hover:text-primary">{row.job.title}</Link> : "—"}</td>
              <td className="px-3 py-3 text-muted-foreground">{row.organisation?.name ?? "—"}</td>
              <td className="px-3 py-3">
                <Badge variant="outline">{row.status}</Badge>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Gig applications</h2>
      {gigs.length === 0 ? (
        <EmptyState title="No gig applications" body="When someone applies to a gig, the row appears here." />
      ) : (
        <AdminTable headers={["When", "Applicant", "Gig", "Organisation", "Status"]}>
          {gigs.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                {row.person ? (
                  <Link href={`/admin/people/${row.person.id}`} className="font-medium hover:text-primary">
                    {row.person.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-3">{row.gig ? <Link href={`/gigs/${row.gig.id}`} className="hover:text-primary">{row.gig.title}</Link> : "—"}</td>
              <td className="px-3 py-3 text-muted-foreground">{row.organisation?.name ?? "—"}</td>
              <td className="px-3 py-3">
                <Badge variant="outline">{row.status}</Badge>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
