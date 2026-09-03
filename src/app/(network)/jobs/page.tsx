import Link from "next/link";
import { JobsView } from "@/features/jobs/jobs-gigs";
import { Button } from "@/components/ui/button";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string; page?: string }>;
}) {
  const { city, type, page } = await searchParams;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <Button asChild>
          <Link href="/jobs/create">Post a job</Link>
        </Button>
      </div>
      <JobsView city={city} employmentType={type} page={Number.parseInt(page ?? "1", 10) || 1} />
    </div>
  );
}
