import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GigDetail } from "@/features/jobs/job-gig-detail";
import { getGig, getOrganisationById } from "@/lib/data/network";
import { getMyGigApplication, isSaved, userCanManageOrganisation } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const gig = await getGig(id);
  if (!gig.data) return { title: "Gig" };
  return entityMetadata({
    title: gig.data.title,
    description: gig.data.description,
    path: `/gigs/${gig.data.id}`,
  });
}

export default async function GigPage({ params }: PageProps) {
  const { id } = await params;
  const gig = await getGig(id);
  if (gig.meta.error) return <QueryNotice configured={gig.meta.configured} error={gig.meta.error} />;
  if (!gig.data) {
    if (!gig.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const org = await getOrganisationById(gig.data.organisationId);
  const saved = session.userId ? await isSaved(session.userId, "gig", gig.data.id) : false;
  const applied = session.userId ? await getMyGigApplication(session.userId, gig.data.id) : null;
  return (
    <GigDetail
      gig={gig.data}
      organisation={org.data}
      saved={saved}
      canManage={await userCanManageOrganisation(session.userId, gig.data.organisationId)}
      appliedStatus={applied?.status ?? null}
    />
  );
}
