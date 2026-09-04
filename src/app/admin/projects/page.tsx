import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { adminSetProjectVerified } from "@/lib/admin/actions";
import { listAdminProjects } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const rows = await listAdminProjects();
  return (
    <div>
      <AdminHeader
        title="Projects"
        body="Mark opted-in network projects as verified. This is not a construction programme of record and does not write Vertex work history."
      />
      {rows.length === 0 ? (
        <EmptyState title="No projects yet" body="Projects people opt into on their passport appear here." />
      ) : (
        <AdminTable headers={["Project", "City", "Status", "Verified", "Created", "Actions"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                <Link href={`/projects/${row.slug}`} className="font-medium hover:text-primary">
                  {row.name}
                </Link>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{row.city ?? "—"}</td>
              <td className="px-3 py-3">{row.status}</td>
              <td className="px-3 py-3">{row.verified ? <Badge variant="success">Verified</Badge> : "—"}</td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                <AdminActionButton
                  label={row.verified ? "Clear verified" : "Mark verified"}
                  action={adminSetProjectVerified.bind(null, row.id, !row.verified)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
