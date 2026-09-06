import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminPager, AdminSearch, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { AdminCreatePersonForm } from "@/features/admin/admin-create-forms";
import { adminHideProfile, adminSetProfileVerification } from "@/lib/admin/actions";
import { listAdminPeople } from "@/lib/admin/data";

export const metadata: Metadata = { title: "People" };

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page ?? "1", 10) || 1;
  const query = params.q ?? "";
  const { rows, total } = await listAdminPeople(query, page);
  return (
    <div>
      <AdminHeader
        title="People"
        body="Add a live passport, upload photos, set verification flags, or hide a profile from public discovery. Hidden profiles stay visible to their owner."
      />
      <AdminCreatePersonForm />
      <AdminSearch action="/admin/people" defaultValue={query} placeholder="Name, handle or city" />
      {rows.length === 0 ? (
        <EmptyState title="No people matched" body="Add a person above, or try a different handle or city." />
      ) : (
        <AdminTable headers={["Person", "Location", "Flags", "Hidden", "Joined", "Actions"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                <Link href={`/admin/people/${row.id}`} className="font-medium hover:text-primary">
                  {row.full_name}
                </Link>
                <p className="text-xs text-muted-foreground">@{row.handle}</p>
                <p className="text-xs text-muted-foreground">{row.headline}</p>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{row.city ?? "—"}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  {row.identity_verified ? <Badge variant="verify">Identity</Badge> : null}
                  {row.employment_verified ? <Badge variant="success">Employment</Badge> : null}
                  {row.trade_verified ? <Badge variant="primary">Trade</Badge> : null}
                </div>
              </td>
              <td className="px-3 py-3">{row.admin_hidden ? <Badge variant="warning">Hidden</Badge> : "Visible"}</td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-1">
                  <AdminActionButton
                    label={row.admin_hidden ? "Unhide" : "Hide"}
                    action={adminHideProfile.bind(null, row.id, !row.admin_hidden)}
                    confirm={row.admin_hidden ? undefined : "Hide this profile from public discovery?"}
                  />
                  <AdminActionButton
                    label={row.identity_verified ? "Clear ID" : "Verify ID"}
                    action={adminSetProfileVerification.bind(null, row.id, "identity", !row.identity_verified)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <AdminPager page={page} total={total} pageSize={24} href="/admin/people" query={query} />
    </div>
  );
}
