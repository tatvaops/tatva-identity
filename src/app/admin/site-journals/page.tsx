import type { Metadata } from "next";
import { AdminHeader } from "@/features/admin/admin-chrome";
import { SiteJournalsTable } from "@/features/admin/site-journals-table";
import { listAdminSiteJournals } from "@/lib/admin/site-journal-actions";

export const metadata: Metadata = { title: "Site journals" };

export default async function AdminSiteJournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const rows = await listAdminSiteJournals({ status, q });
  return (
    <div>
      <AdminHeader
        title="Site journals"
        body="Review draft and pending diaries, then publish. This does not write Vertex site operations."
      />
      <SiteJournalsTable rows={rows} />
    </div>
  );
}
