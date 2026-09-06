import { notFound, redirect } from "next/navigation";
import { ProfessionalView } from "@/features/identiti/professional-view";
import { QueryNotice } from "@/components/states/empty-state";
import { getProfileByHandle } from "@/lib/data/profile";
import { getIdentitiBrandById, listIdentitiProjectsForProfile, recordIdentitiEvent } from "@/lib/data/identiti";
import { listExperiences, listPublicCertifications, listRecommendations } from "@/lib/data/network";
import { isGigOccupation, personPublicHref } from "@/lib/domain/identiti-routes";

export default async function ProfessionalPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (profile.meta.error) return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  if (!profile.data) {
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  if (isGigOccupation(profile.data.occupationMode)) {
    redirect(personPublicHref(profile.data.handle, profile.data.occupationMode));
  }
  const [projects, employer, experiences, certifications, recommendations] = await Promise.all([
    listIdentitiProjectsForProfile(profile.data.id),
    profile.data.currentOrganisationId ? getIdentitiBrandById(profile.data.currentOrganisationId) : Promise.resolve(null),
    listExperiences(profile.data.id),
    listPublicCertifications(profile.data.id),
    listRecommendations(profile.data.id),
  ]);
  await recordIdentitiEvent("professional_profile_view", "profile", profile.data.id);
  return (
    <ProfessionalView
      profile={profile.data}
      projects={projects}
      employer={employer}
      experiences={experiences.data}
      certifications={certifications.data}
      recommendations={recommendations.data}
    />
  );
}
