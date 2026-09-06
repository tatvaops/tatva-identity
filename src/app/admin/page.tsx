import type { Metadata } from "next";
import { AdminHeader, AdminStat, adminDate } from "@/features/admin/admin-chrome";
import { EmptyState } from "@/components/states/empty-state";
import { Card } from "@/components/ui/card";
import { countAdminViews, listAdminVerifications, loadAdminStats } from "@/lib/admin/data";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Operations overview" };

export default async function AdminOverviewPage() {
  const [stats, views, pending] = await Promise.all([
    loadAdminStats(),
    countAdminViews(),
    listAdminVerifications("pending"),
  ]);
  if (!stats) {
    return (
      <EmptyState title="Operations data is unavailable" body="Sign in as a platform operator with service-role access configured." />
    );
  }
  return (
    <div>
      <AdminHeader
        title="Operations overview"
        body="Add live people, organisations, projects and listings from each section. Hire, Quote and Vertex work history stay out of this console."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStat label="Pending verifications" value={stats.pendingVerifications} href="/admin/verifications" tone={stats.pendingVerifications ? "warn" : "ok"} />
        <AdminStat label="Open reports" value={stats.openReports} href="/admin/moderation" tone={stats.openReports ? "warn" : "default"} />
        <AdminStat label="People" value={stats.people} href="/admin/people" />
        <AdminStat label="Organisations" value={stats.organisations} href="/admin/organisations" />
        <AdminStat label="Open jobs" value={stats.openJobs} href="/admin/opportunities" />
        <AdminStat label="Open gigs" value={stats.openGigs} href="/admin/opportunities" />
        <AdminStat label="Visible posts" value={stats.posts} href="/admin/moderation" />
        <AdminStat label="Operators" value={stats.operators} href="/admin/settings" />
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <AdminStat label="Profile views (7d)" value={views.profileViews} href="/admin/activity" />
        <AdminStat label="Organisation views (7d)" value={views.orgViews} href="/admin/activity" />
        <AdminStat label="Search appearances (7d)" value={views.searchAppearances} href="/admin/activity" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Publish live records</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Each section can add real people, organisations, projects, jobs, gigs and posts with photos. Seed rows stay labelled demonstration data.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/admin/people" className="text-primary hover:underline">
              People
            </Link>
            <Link href="/admin/organisations" className="text-primary hover:underline">
              Organisations
            </Link>
            <Link href="/admin/projects" className="text-primary hover:underline">
              Projects
            </Link>
            <Link href="/admin/opportunities" className="text-primary hover:underline">
              Jobs & gigs
            </Link>
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Demonstration data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seed rows are labelled demonstration data. They are {stats.seedEnabled ? "currently visible" : "currently hidden"} in public directories.
          </p>
          <Link href="/admin/settings" className="mt-3 inline-block text-sm text-primary hover:underline">
            Change in settings
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Hidden by operators</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {stats.hiddenPeople} people and {stats.hiddenOrganisations} organisations are held out of public discovery.
          </p>
        </Card>
      </div>
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Verification queue</h2>
          <Link href="/admin/verifications" className="text-sm text-primary hover:underline">
            Open queue
          </Link>
        </div>
        {pending.length === 0 ? (
          <EmptyState title="No pending checks" body="When someone requests identity, employment or trade verification, it appears here for a reviewer." />
        ) : (
          <ul className="space-y-2">
            {pending.slice(0, 8).map((row) => (
              <li key={row.id} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{row.person?.full_name ?? "Person"}</p>
                  <p className="text-xs text-muted-foreground">
                    @{row.person?.handle} · {row.kind} · {adminDate(row.created_at)}
                  </p>
                </div>
                <Badge variant="warning">{row.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
