import type { Metadata } from "next";
import { AdminHeader, AdminStat } from "@/features/admin/admin-chrome";
import { EmptyState } from "@/components/states/empty-state";
import { Card } from "@/components/ui/card";
import { countAdminViews, listAdminEvents } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Activity" };

export default async function AdminActivityPage() {
  const [events, views] = await Promise.all([listAdminEvents(), countAdminViews()]);
  return (
    <div>
      <AdminHeader
        title="Activity"
        body="First-party product events from the last 7 days. Events are recorded automatically when people use the network — operators do not invent rows here."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStat label="Profile views" value={views.profileViews} />
        <AdminStat label="Organisation views" value={views.orgViews} />
        <AdminStat label="Search appearances" value={views.searchAppearances} />
      </div>
      {events.length === 0 ? (
        <EmptyState title="No events yet" body="Named product events are recorded when people use the network. Counts here are last 7 days." />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-zinc-50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Event</th>
                <th className="px-4 py-2 font-medium">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events.map((row) => (
                <tr key={row.name}>
                  <td className="px-4 py-2 font-medium">{row.name.replaceAll("_", " ")}</td>
                  <td className="px-4 py-2 tabular-nums">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
