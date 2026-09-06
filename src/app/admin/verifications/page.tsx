import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminCreateVerificationForm } from "@/features/admin/admin-create-forms";
import { AdminReviewForm } from "@/features/admin/admin-forms";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { listAdminChoices, listAdminVerifications } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Verifications" };

export default async function AdminVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const current = status === "approved" || status === "declined" ? status : "pending";
  const [rows, choices] = await Promise.all([listAdminVerifications(current), listAdminChoices()]);
  return (
    <div>
      <AdminHeader
        title="Verifications"
        body="File a new identity, employment or trade request, then approve it. Approval sets the matching public flag. This does not mint a Vertex credential."
      />
      <AdminCreateVerificationForm people={choices.people} />
      <div className="mb-4 flex gap-2 text-sm">
        {(["pending", "approved", "declined"] as const).map((value) => (
          <Link
            key={value}
            href={value === "pending" ? "/admin/verifications" : `/admin/verifications?status=${value}`}
            className={current === value ? "font-semibold text-foreground" : "text-muted-foreground hover:text-foreground"}
          >
            {value}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={`No ${current} requests`} body="Verification requests from passports land here for a human reviewer." />
      ) : (
        <AdminTable headers={["Person", "Kind", "Requested", "Note", current === "pending" ? "Review" : "Status"]}>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                {row.person ? (
                  <Link href={`/admin/people/${row.profile_id}`} className="font-medium hover:text-primary">
                    {row.person.full_name}
                  </Link>
                ) : (
                  "—"
                )}
                <p className="text-xs text-muted-foreground">@{row.person?.handle}</p>
              </td>
              <td className="px-3 py-3">{row.kind}</td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="max-w-xs px-3 py-3 text-muted-foreground">{row.reviewer_note ?? "—"}</td>
              <td className="px-3 py-3">
                {current === "pending" ? <AdminReviewForm requestId={row.id} /> : <Badge>{row.status}</Badge>}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
