import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { PublicPassportView } from "@/features/passport/public-passport";
import { QueryNotice } from "@/components/states/empty-state";
import { isPassportWorkspaceSection } from "@/lib/domain/passport-workspace";
import {
  getProfileByHandle,
  listExperiences,
  listOptedInProjects,
  listProfileSkills,
  listPublicCertifications,
  listRecommendations,
} from "@/lib/data/network";

export default async function PublicPassportPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (profile.meta.error) return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  if (!profile.data) {
    if (isPassportWorkspaceSection(handle)) redirect(`/passport?section=${handle}`);
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }

  const [experiences, skills, certs, projects, recs] = await Promise.all([
    listExperiences(profile.data.id),
    listProfileSkills(profile.data.id),
    listPublicCertifications(profile.data.id),
    listOptedInProjects(profile.data.id),
    listRecommendations(profile.data.id),
  ]);
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  return (
    <PublicPassportView
      profile={profile.data}
      experiences={experiences.data}
      skills={skills.data}
      certifications={certs.data}
      projects={projects.data}
      recommendations={recs.data}
      origin={origin}
    />
  );
}
