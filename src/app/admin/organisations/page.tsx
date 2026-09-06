import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminPager, AdminSearch, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminCreateOrganisationForm } from "@/features/admin/admin-create-forms";
import { adminHideOrganisation } from "@/lib/admin/actions";
import { listAdminOrganisations } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Organisations" };

export default async function AdminOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const query = params.q ?? "";
  const { rows, total } = await listAdminOrganisations(query, page);
  return (
    <div>
      <AdminHeader
        title="Organisations"
        body="Add a live company or brand, upload cover and logo, then hide from discovery if needed. This is not Vertex company operations."
      />
      <AdminCreateOrganisationForm />
      <AdminSearch action="/admin/organisations" defaultValue={query} placeholder="Name, slug or city" />
      {rows.length === 0 ? (
        <EmptyState title="No organisations matched" body="Add an organisation above, or search a different name." />
      ) : (
        <AdminTable headers={["Organisation", "Type", "Location", "Hidden", "Created", "Actions"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                <Link href={`/admin/organisations/${row.id}`} className="font-medium hover:text-primary">
                  {row.name}
                </Link>
                <p className="text-xs text-muted-foreground">/{row.slug}</p>
              </td>
              <td className="px-3 py-3">{row.organisation_type?.replaceAll("_", " ")}</td>
              <td className="px-3 py-3 text-muted-foreground">{row.city ?? "—"}</td>
              <td className="px-3 py-3">{row.admin_hidden ? <Badge variant="warning">Hidden</Badge> : "Visible"}</td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                <AdminActionButton
                  label={row.admin_hidden ? "Unhide" : "Hide"}
                  action={adminHideOrganisation.bind(null, row.id, !row.admin_hidden)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <AdminPager page={page} total={total} pageSize={24} href="/admin/organisations" query={query} />
    </div>
  );
}
