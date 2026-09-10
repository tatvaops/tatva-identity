"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminTable, adminDate } from "@/features/admin/admin-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { adminPatchSiteJournal } from "@/lib/admin/site-journal-actions";
import type { SiteJournalRow } from "@/lib/domain/site-journal";
import { siteJournalPath } from "@/lib/domain/site-journal-routes";

export function SiteJournalsTable({ rows }: Readonly<{ rows: SiteJournalRow[] }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (rows.length === 0) {
    return <EmptyState title="No site journals" body="When someone starts a diary, it appears here for review." />;
  }
  return (
    <div>
      <AdminTable headers={["Journal", "City", "Status", "Health", "Updated", "Actions"]}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-3 py-3">
              <Link href={siteJournalPath(row.slug)} className="font-medium hover:text-primary">
                {row.title}
              </Link>
            </td>
            <td className="px-3 py-3 text-muted-foreground">{row.city ?? "—"}</td>
            <td className="px-3 py-3">
              <Badge variant="outline">{row.status.replaceAll("_", " ")}</Badge>
            </td>
            <td className="px-3 py-3">{row.health_status.replaceAll("_", " ")}</td>
            <td className="px-3 py-3 text-muted-foreground">{adminDate(row.updated_at ?? row.created_at)}</td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-1">
                {row.status === "pending_review" || row.status === "draft" ? (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const result = await adminPatchSiteJournal(row.id, { status: "published" });
                        if (!result.ok) setError(result.error);
                        else router.refresh();
                      })
                    }
                  >
                    Publish
                  </Button>
                ) : null}
                {row.status === "published" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        const result = await adminPatchSiteJournal(row.id, { status: "archived" });
                        if (!result.ok) setError(result.error);
                        else router.refresh();
                      })
                    }
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
      {error ? (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
