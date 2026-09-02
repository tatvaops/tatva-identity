import { notFound } from "next/navigation";
import { PersonProfileView } from "@/features/profile/person-profile";
import {
  getProfileByHandle,
  listExperiences,
  listProfileSkills,
  listPublicCertifications,
  listRecommendations,
  listOptedInProjects,
  listPostsByAuthor,
} from "@/lib/data/network";
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
