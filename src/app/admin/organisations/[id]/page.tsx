import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { AdminOrgCredentialState } from "@/features/admin/admin-forms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminHideOrganisation, adminSetProjectVerified } from "@/lib/admin/actions";
import { getAdminOrganisation } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Organisation" };

export default async function AdminOrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminOrganisation(id);
  if (!data) notFound();
  const { organisation, credentials, projects } = data;
  return (
    <div>
      <AdminHeader title={organisation.name} body={`${organisation.tagline || organisation.about || "Business passport"} · /${organisation.slug}`} />
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href={`/companies/${organisation.slug}`} className="text-primary hover:underline">
          Open public company
        </Link>
        <span className="text-muted-foreground">
          {organisation.organisation_type?.replaceAll("_", " ")} · {organisation.city} · {organisation.industry}
        </span>
        <span className="text-muted-foreground">Created {adminDate(organisation.created_at)}</span>
      </div>
      <Card className="p-5">
        <p className="text-sm font-semibold">Discovery</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Workplace phone and email stay on the organisation record for members. They are not dumped here.
        </p>
        <div className="mt-3">
          <AdminActionButton
            label={organisation.admin_hidden ? "Unhide organisation" : "Hide from discovery"}
            variant={organisation.admin_hidden ? "outline" : "destructive"}
            action={adminHideOrganisation.bind(null, organisation.id, !organisation.admin_hidden)}
          />
        </div>
        {organisation.admin_hidden ? <Badge variant="warning" className="mt-3">Hidden</Badge> : null}
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Credentials</p>
          {credentials.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">None listed.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {credentials.map((cred) => (
                <li key={cred.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium">{cred.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cred.category}
                      {cred.expiry_label ? ` · ${cred.expiry_label}` : ""}
                    </p>
                  </div>
                  <AdminOrgCredentialState id={cred.id} current={cred.verification_state} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Linked projects</p>
          {projects.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No opted-in projects linked as client or main contractor.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {projects.map((project) => (
                <li key={project.id} className="flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/projects/${project.slug}`} className="text-sm font-medium hover:text-primary">
                      {project.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {project.city} · {project.status}
                      {project.verified ? " · verified" : ""}
                    </p>
                  </div>
                  <AdminActionButton
                    label={project.verified ? "Clear verified" : "Mark verified"}
                    action={adminSetProjectVerified.bind(null, project.id, !project.verified)}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
