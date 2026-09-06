import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import {
  AdminAiReviewBodyForm,
  AdminAiSourceForm,
  AdminContributorForm,
  AdminOrgCredentialState,
  AdminOrganisationMediaForm,
  AdminPassportKindForm,
  AdminPerformanceForm,
  AdminProductForm,
  AdminProductUseForm,
  AdminProjectMediaForm,
  AdminStrengthForm,
  AdminVideoForm,
} from "@/features/admin/admin-forms";
import { AdminCreateOrgCredentialForm } from "@/features/admin/admin-create-forms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminHideOrganisation, adminSetProjectVerified } from "@/lib/admin/actions";
import { getAdminOrganisation } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Organisation" };

export default async function AdminOrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminOrganisation(id);
  if (!data) notFound();
  const { organisation, credentials, projects, ai, review, products, performance, strengths, videos, people } = data;
  return (
    <div>
      <AdminHeader title={organisation.name} body={`${organisation.tagline || organisation.about || "Business passport"} · /${organisation.slug}`} />
      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link
          href={
            organisation.passport_kind === "product_brand"
              ? `/product-brands/${organisation.slug}`
              : organisation.passport_kind === "service_brand"
                ? `/service-brands/${organisation.slug}`
                : `/companies/${organisation.slug}`
          }
          className="text-primary hover:underline"
        >
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
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-sm font-semibold">Public kind</p>
          <AdminPassportKindForm organisationId={organisation.id} current={organisation.passport_kind} />
        </div>
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
          <AdminCreateOrgCredentialForm organisationId={organisation.id} />
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
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Performance</p>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">Shown on the service brand page. Labelled self-declared unless later verified.</p>
          <AdminPerformanceForm
            organisationId={organisation.id}
            onTimePct={performance?.on_time_pct}
            qualityRating={performance?.quality_rating}
            completedProjects={performance?.completed_projects}
            ongoingProjects={performance?.ongoing_projects}
          />
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Strengths and showreel</p>
          {strengths.length > 0 ? <p className="mt-1 mb-2 text-xs text-muted-foreground">{strengths.map((row) => row.title).join(" · ")}</p> : null}
          {videos.length > 0 ? <p className="mb-2 text-xs text-muted-foreground">{videos.length} video{videos.length === 1 ? "" : "s"} listed</p> : null}
          <AdminStrengthForm organisationId={organisation.id} />
          <div className="mt-4">
            <AdminVideoForm organisationId={organisation.id} />
          </div>
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">People on delivered work</p>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">Names someone on a project this brand already appears on. They then show on the public brand page.</p>
        <AdminContributorForm projects={projects} people={people} />
      </Card>
      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">Brand media</p>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Public cover and logo. Empty URLs hide the photo instead of leaving a blank box.
        </p>
        <AdminOrganisationMediaForm
          organisationId={organisation.id}
          coverPath={organisation.cover_path}
          logoPath={organisation.logo_path}
          categoryLabel={organisation.category_label}
          servingRegions={organisation.serving_regions}
        />
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Products</p>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">Each product gets its own public page under this brand.</p>
          <div className="space-y-6">
            {products.map((product) => (
              <AdminProductForm key={product.id} organisationId={organisation.id} product={product} />
            ))}
            <AdminProductForm organisationId={organisation.id} />
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Application proof</p>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">Link a product to a project this brand already appears on.</p>
          <AdminProductUseForm products={products} projects={projects} />
        </Card>
      </div>
      {projects.length > 0 ? (
        <Card className="mt-4 p-5">
          <p className="text-sm font-semibold">Project media</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded-xl border border-border p-4">
                <p className="mb-3 text-sm font-medium">{project.name}</p>
                <AdminProjectMediaForm
                  projectId={project.id}
                  coverImageUrl={project.cover_image_url}
                  youtubeUrl={project.youtube_url}
                  qcNotes={project.qc_notes}
                  testimonial={project.testimonial}
                  valueLabel={project.value_label}
                />
              </div>
            ))}
          </div>
        </Card>
      ) : null}
      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">AI review source</p>
        <p className="mt-1 mb-3 text-sm text-muted-foreground">
          Labelled as Google Reviews or Vantage Forum. Below the evidence threshold the public pulse stays empty.
        </p>
        <AdminAiSourceForm
          organisationId={organisation.id}
          source={ai?.ai_review_source ?? "vantage_forum"}
          enabled={ai?.ai_review_enabled ?? true}
        />
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-3 text-sm font-semibold">Labelled pulse copy</p>
          <AdminAiReviewBodyForm
            organisationId={organisation.id}
            sourceKind={review?.source_kind}
            sourceLabel={review?.source_label}
            summary={review?.summary}
            sourceCount={review?.source_count}
            sourceHref={review?.source_href}
          />
        </div>
      </Card>
    </div>
  );
}
