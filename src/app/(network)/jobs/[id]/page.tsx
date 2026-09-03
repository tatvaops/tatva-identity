import { notFound } from "next/navigation";
import { JobDetail } from "@/features/jobs/job-gig-detail";
import { getJob, getOrganisationById, listJobs } from "@/lib/data/network";
import { isSaved } from "@/lib/data/workspace";
import { getAuthContext } from "@/lib/data/query";
import { QueryNotice } from "@/components/states/empty-state";

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
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
  return (
    <JobDetail
      job={job.data}
      organisation={org.data}
      similar={similar.data.filter((j) => j.id !== job.data!.id).slice(0, 3)}
      saved={saved}
      canManage={Boolean(session.userId && org.data?.createdBy === session.userId)}
    />
  );
}
