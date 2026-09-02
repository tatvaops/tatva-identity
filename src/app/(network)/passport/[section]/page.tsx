import { redirect } from "next/navigation";
import { PassportView } from "@/features/passport/passport-view";
import { getAuthContext } from "@/lib/data/query";
import {
  listExperiences,
  listProfileSkills,
  listPublicCertifications,
  listOptedInProjects,
  listRecommendations,
} from "@/lib/data/network";

export default async function PassportSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const session = await getAuthContext();
  if (!session.profile) redirect(`/auth/sign-in?next=/passport/${section}`);
  const [experiences, skills, certs, projects, recs] = await Promise.all([
    listExperiences(session.profile.id),
    listProfileSkills(session.profile.id),
    listPublicCertifications(session.profile.id),
    listOptedInProjects(session.profile.id),
    listRecommendations(session.profile.id),
  ]);
  return (
    <PassportView
      profile={session.profile}
      section={section}
      experiences={experiences.data}
      skills={skills.data}
      certifications={certs.data}
      projects={projects.data}
      recommendations={recs.data}
    />
  );
}
