import { notFound } from "next/navigation";
import { PersonProfileView } from "@/features/profile/person-profile";
import {
  getProfileByHandle,
  listExperiences,
  listProfileSkills,
  listPublicCertifications,
  listRecommendations,
  listOptedInProjects,
} from "@/lib/data/profile";
import { listPostsByAuthor } from "@/lib/data/discovery";
import { recordProfileView } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function PersonPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByHandle(username);
  if (profile.meta.error) {
    return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  }
  if (!profile.data) {
    if (!profile.meta.configured) {
      return <QueryNotice configured={false} error={null} />;
    }
    notFound();
  }
  const session = await getAuthContext();
  await recordProfileView(profile.data.id, session.userId);
  const [experiences, skills, certs, recs, projects, posts] = await Promise.all([
    listExperiences(profile.data.id),
    listProfileSkills(profile.data.id),
    listPublicCertifications(profile.data.id),
    listRecommendations(profile.data.id),
    listOptedInProjects(profile.data.id),
    listPostsByAuthor(profile.data.id),
  ]);
  return (
    <PersonProfileView
      profile={profile.data}
      experiences={experiences.data}
      skills={skills.data}
      certifications={certs.data}
      recommendations={recs.data}
      projects={projects.data}
      posts={posts.data}
    />
  );
}
