import { notFound, redirect } from "next/navigation";
import { OrganisationCatalogueForms, OrganisationForm } from "@/features/company/org-forms";
import { getOrganisationBySlug } from "@/lib/data/organisation";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function EditCompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getAuthContext();
  const { slug } = await params;
  if (!session.userId) redirect(`/auth/sign-in?next=/companies/${slug}/edit`);
  const org = await getOrganisationBySlug(slug);
  if (org.meta.error) return <QueryNotice configured={org.meta.configured} error={org.meta.error} />;
  if (!org.data) notFound();
  if (org.data.createdBy !== session.userId) redirect(`/companies/${slug}`);
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Edit {org.data.name}</h1>
      <OrganisationForm org={org.data} />
      <OrganisationCatalogueForms organisationId={org.data.id} />
    </div>
  );
}
