import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { adminHidePost, adminResolveReport } from "@/lib/admin/actions";
import { listAdminPosts, listAdminReports } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Moderation" };

export default async function AdminModerationPage() {
  const [reports, posts] = await Promise.all([listAdminReports(), listAdminPosts()]);
  return (
    <div>
      <AdminHeader
        title="Moderation"
        body="Reports from the network and posts you can hold out of the public feed. Hidden posts remain visible to their author."
      />
      <h2 className="mb-3 text-lg font-semibold">Reports</h2>
      {reports.length === 0 ? (
        <EmptyState title="No reports" body="People can report a post from the feed. Open reports stay here until an operator acts." />
      ) : (
        <AdminTable headers={["Reporter", "Target", "Reason", "Status", "When", "Actions"]}>
          {reports.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                {row.reporter ? (
                  <Link href={`/admin/people/${row.reporter_id}`} className="hover:text-primary">
                    {row.reporter.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {row.entity_kind} · {row.entity_id.slice(0, 8)}
              </td>
              <td className="px-3 py-3">{row.reason ?? "—"}</td>
              <td className="px-3 py-3">
                <Badge variant={row.status === "open" ? "warning" : "outline"}>{row.status}</Badge>
              </td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                {row.status === "open" ? (
                  <div className="flex flex-wrap gap-1">
                    <AdminActionButton label="Actioned" action={adminResolveReport.bind(null, row.id, "actioned")} />
                    <AdminActionButton label="Dismiss" action={adminResolveReport.bind(null, row.id, "dismissed")} />
                  </div>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <h2 className="mb-3 mt-8 text-lg font-semibold">Posts</h2>
      {posts.length === 0 ? (
        <EmptyState title="No posts" body="Network updates appear here for hide / unhide." />
      ) : (
        <AdminTable headers={["Author", "Type", "Body", "State", "When", "Actions"]}>
          {posts.map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-3">
                {row.author ? (
                  <Link href={`/admin/people/${row.author_profile_id}`} className="font-medium hover:text-primary">
                    {row.author.full_name}
                  </Link>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-3">{row.post_type.replaceAll("_", " ")}</td>
              <td className="max-w-sm px-3 py-3 text-muted-foreground">{row.body.slice(0, 140)}</td>
              <td className="px-3 py-3">{row.hidden_at ? <Badge variant="warning">Hidden</Badge> : "Visible"}</td>
              <td className="px-3 py-3 text-muted-foreground">{adminDate(row.created_at)}</td>
              <td className="px-3 py-3">
                <AdminActionButton
                  label={row.hidden_at ? "Unhide" : "Hide"}
                  action={adminHidePost.bind(null, row.id, !row.hidden_at)}
                />
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
