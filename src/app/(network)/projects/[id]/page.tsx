import { notFound } from "next/navigation";
import { ProjectProfileView } from "@/features/projects/project-profile";
import {
  getProjectBySlug,
  getOrganisationById,
  listFeedPosts,
  listOrganisations,
} from "@/lib/data/network";
import { createServerSupabase } from "@/lib/supabase/server";
import { QueryNotice } from "@/components/states/empty-state";
import { mapPublicProfile } from "@/lib/data/mappers";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProjectBySlug(id);
  if (project.meta.error) return <QueryNotice configured={project.meta.configured} error={project.meta.error} />;
  if (!project.data) {
    if (!project.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const client = project.data.clientOrganisationId
    ? (await getOrganisationById(project.data.clientOrganisationId)).data
    : null;
  const main = project.data.mainContractorId
    ? (await getOrganisationById(project.data.mainContractorId)).data
    : null;
  const supabase = await createServerSupabase();
  let contributors: ReturnType<typeof mapPublicProfile>[] = [];
  if (supabase) {
    const { data } = await supabase
      .from("project_contributors")
      .select("profile_id, public_profiles(*)")
      .eq("project_id", project.data.id)
      .eq("opted_in", true);
    contributors = (data ?? [])
      .map((row) => {
        const p = row.public_profiles as unknown;
        return p && typeof p === "object" ? mapPublicProfile(p as Parameters<typeof mapPublicProfile>[0]) : null;
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }
  const companies = (await listOrganisations()).data.filter(
    (o) => o.id === project.data!.clientOrganisationId || o.id === project.data!.mainContractorId,
  );
  const updates = (await listFeedPosts()).data.filter((p) => p.linkedProjectId === project.data!.id);
  return (
    <ProjectProfileView
      project={project.data}
      client={client}
      main={main}
      contributors={contributors}
      companies={companies}
      updates={updates}
    />
  );
}
