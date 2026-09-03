import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { PublicBusinessPassportView } from "@/features/company/public-business-passport";
import {
  getOrganisationBySlug,
  listOrgCredentials,
  listOrgPeople,
  listOrgProjects,
  listOrgServices,
} from "@/lib/data/organisation";
import { QueryNotice } from "@/components/states/empty-state";

export default async function OrgPassportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrganisationBySlug(slug);
  if (org.meta.error) return <QueryNotice configured={org.meta.configured} error={org.meta.error} />;
  if (!org.data) notFound();
  const [services, credentials, projects, people] = await Promise.all([
    listOrgServices(org.data.id),
    listOrgCredentials(org.data.id),
    listOrgProjects(org.data.id),
    listOrgPeople(org.data.id),
  ]);
  const host = (await headers()).get("host");
  const origin = host ? `https://${host}` : "";
  return (
    <PublicBusinessPassportView
      org={org.data}
      services={services.data}
      credentials={credentials.data}
      projects={projects.data}
      people={people.data}
      origin={origin}
    />
  );
}
