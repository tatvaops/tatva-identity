import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JobDetail } from "@/features/jobs/job-gig-detail";
import { getJob, getOrganisationById, listJobs } from "@/lib/data/network";
import { getMyJobApplication, isSaved, userCanManageOrganisation } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";
import { entityMetadata } from "@/lib/domain/seo";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const job = await getJob(id);
  if (!job.data) return { title: "Job" };
  return entityMetadata({
    title: job.data.title,
    description: job.data.description,
    path: `/jobs/${job.data.id}`,
  });
}

export default async function JobPage({ params }: PageProps) {
  const { id } = await params;
  const job = await getJob(id);
  if (job.meta.error) return <QueryNotice configured={job.meta.configured} error={job.meta.error} />;
  if (!job.data) {
    if (!job.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const session = await getAuthContext();
  const org = await getOrganisationById(job.data.organisationId);
  const similar = await listJobs();
  const saved = session.userId ? await isSaved(session.userId, "job", job.data.id) : false;
  const applied = session.userId ? await getMyJobApplication(session.userId, job.data.id) : null;
  return (
    <JobDetail
      job={job.data}
      organisation={org.data}
      similar={similar.data.filter((j) => j.id !== job.data!.id).slice(0, 3)}
      saved={saved}
      canManage={await userCanManageOrganisation(session.userId, job.data.organisationId)}
      appliedStatus={applied?.status ?? null}
    />
  );
}
