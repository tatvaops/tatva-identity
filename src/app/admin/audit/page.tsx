import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminPager, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { EmptyState } from "@/components/states/empty-state";
import { listAdminAudit } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Audit" };

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Number.parseInt((await searchParams).page ?? "1", 10) || 1;
  const { rows, total } = await listAdminAudit(page);
  return (
    <div>
      <AdminHeader
        title="Audit"
        body="What operators changed, including new people, organisations, projects and listings. Actor, action and entity only — no Aadhaar, payroll or Vertex tables."
      />
      {rows.length === 0 ? (
        <EmptyState title="No operator actions yet" body="Hide, verify, grant and close actions write a row here." />
      ) : (
        <AdminTable headers={["When", "Operator", "Action", "Entity"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                {row.actor ? (
                  <Link href={`/admin/people/${row.actor_id}`} className="hover:text-primary">
                    {row.actor.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-3 font-medium">{row.action.replaceAll("_", " ")}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {row.entity_kind}
                {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <AdminPager page={page} total={total} pageSize={40} href="/admin/audit" />
    </div>
  );
}
