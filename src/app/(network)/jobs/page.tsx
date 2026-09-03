import { JobsView } from "@/features/jobs/jobs-gigs";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; type?: string }>;
}) {
  const { city, type } = await searchParams;
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Jobs</h1>
      <JobsView city={city} employmentType={type} />
    </div>
  );
}
