import { redirect } from "next/navigation";
import { PassportView } from "@/features/passport/passport-view";
import { getAuthContext } from "@/lib/data/query";
import { listPortfolio, listSkillFacts } from "@/lib/data/identiti";
import { listEducation, listEvidence, listProfileServices } from "@/lib/data/workspace";
import {
  listExperiences,
  listProfileSkills,
  listPublicCertifications,
  listOptedInProjects,
  listRecommendations,
} from "@/lib/data/network";

export default async function PassportPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/passport");
  if (!session.profile) redirect("/onboarding");
  const [experiences, skills, certs, projects, recs, education, portfolio, facts, services, evidence] = await Promise.all([
    listExperiences(session.profile.id),
    listProfileSkills(session.profile.id),
    listPublicCertifications(session.profile.id),
    listOptedInProjects(session.profile.id),
    listRecommendations(session.profile.id),
    listEducation(session.profile.id),
    listPortfolio(session.profile.id),
    listSkillFacts(session.profile.id),
    listProfileServices(session.profile.id),
    listEvidence(session.profile.id),
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
      education={education.data}
      portfolio={portfolio}
      facts={facts}
      services={services.data}
      evidence={evidence.data}
    />
  );
}
