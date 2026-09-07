import Link from "next/link";
import { JobsView } from "@/features/jobs/jobs-gigs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/section";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string; page?: string }>;
}) {
  const { city, type, page } = await searchParams;
  return (
    <div>
      <PageHeader
        eyebrow="Opportunity"
        title="Jobs"
        body="Permanent and contract roles. Not the same as gigs."
        action={
          <Button asChild>
            <Link href="/jobs/create">Post a job</Link>
          </Button>
        }
      />
      <JobsView city={city} employmentType={type} page={Number.parseInt(page ?? "1", 10) || 1} />
    </div>
  );
}
