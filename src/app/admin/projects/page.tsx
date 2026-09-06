import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminCreateProjectForm } from "@/features/admin/admin-create-forms";
import { AdminProjectMediaForm } from "@/features/admin/admin-forms";
import { adminSetProjectVerified } from "@/lib/admin/actions";
import { listAdminChoices, listAdminProjects } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Projects" };

export default async function AdminProjectsPage() {
  const [rows, choices] = await Promise.all([listAdminProjects(), listAdminChoices()]);
  return (
    <div>
      <AdminHeader
        title="Projects"
        body="Add a live project with cover photo and YouTube walkthrough, or mark an existing one verified. This does not write Vertex work history."
      />
      <AdminCreateProjectForm organisations={choices.organisations} />
      {rows.length === 0 ? (
        <EmptyState title="No projects yet" body="Add a project above. It will appear on the public projects directory." />
      ) : (
        <>
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
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <div key={`${row.id}-media`} className="rounded-xl border border-border p-4">
              <p className="mb-3 text-sm font-medium">{row.name}</p>
              <AdminProjectMediaForm
                projectId={row.id}
                coverImageUrl={row.cover_image_url}
                youtubeUrl={row.youtube_url}
                qcNotes={row.qc_notes}
                testimonial={row.testimonial}
                valueLabel={row.value_label}
              />
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
