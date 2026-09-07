import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
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
  getConnectionState,
} from "@/lib/data/network";
import { listEducation } from "@/lib/data/workspace";
import { entityMetadata } from "@/lib/domain/seo";
import { getAuthContext } from "@/lib/data/query";
import { viewerIsRecruiter } from "@/lib/data/privacy";
import { applyProfilePrivacy, showAvailability, showExperience, showProjects, viewerFromNetwork } from "@/lib/domain/visibility";

type PageProps = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (!profile.data) return { title: "Passport" };
  return entityMetadata({
    title: `${profile.data.fullName} · Passport`,
    description: profile.data.headline ?? profile.data.about,
    path: `/passport/${profile.data.handle}`,
    image: profile.data.avatarPath,
  });
}

export default async function PublicPassportPage({ params }: PageProps) {
  const { handle } = await params;
  const profile = await getProfileByHandle(handle);
  if (profile.meta.error) return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  if (!profile.data) {
    if (isPassportWorkspaceSection(handle)) redirect(`/passport?section=${handle}`);
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }

  const [experiences, skills, certs, projects, recs, education] = await Promise.all([
    listExperiences(profile.data.id),
    listProfileSkills(profile.data.id),
    listPublicCertifications(profile.data.id),
    listOptedInProjects(profile.data.id),
    listRecommendations(profile.data.id),
    listEducation(profile.data.id),
  ]);
  const session = await getAuthContext();
  const connectionState = session.userId ? await getConnectionState(session.userId, profile.data.id) : "connect";
  const isOwner = session.userId === profile.data.id;
  const isRecruiter = session.userId ? await viewerIsRecruiter() : false;
  const relation = viewerFromNetwork({ isOwner, connectionState, isRecruiter });
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const origin = `${proto}://${host}`;

  return (
    <PublicPassportView
      profile={applyProfilePrivacy(profile.data, relation)}
      experiences={showExperience(profile.data, relation) ? experiences.data : []}
      skills={skills.data}
      certifications={certs.data}
      projects={showProjects(profile.data, relation) ? projects.data : []}
      recommendations={recs.data}
      education={education.data}
      origin={origin}
      showAvailability={showAvailability(profile.data, relation)}
    />
  );
}
