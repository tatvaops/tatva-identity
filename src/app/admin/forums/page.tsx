import type { Metadata } from "next";
import { AdminHeader } from "@/features/admin/admin-chrome";
import { AdminForumLinkForm } from "@/features/admin/admin-forms";
import { Card } from "@/components/ui/card";
import { listAdminForumLinks } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Forums" };

export default async function AdminForumsPage() {
  const links = await listAdminForumLinks();
  return (
    <div>
      <AdminHeader
        title="Forum mappings"
        body="Map IDENTITI brands and products to Vantage thread slugs. IDENTITI never hosts the discussion."
      />
      <Card className="mb-6 p-5">
        <p className="mb-3 text-sm font-semibold">Add or update a mapping</p>
        <AdminForumLinkForm />
      </Card>
      <div className="space-y-4">
        {links.map((link) => (
          <Card key={link.id} className="p-5">
            <p className="text-sm font-medium">
              {link.entity_type} · {link.entity_id}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {link.thread_slug || "no slug"} · {link.status}
            </p>
            <div className="mt-3">
              <AdminForumLinkForm
                id={link.id}
                entityType={link.entity_type}
                entityId={link.entity_id}
                threadSlug={link.thread_slug ?? ""}
                canonicalUrl={link.canonical_url ?? ""}
                status={link.status}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
