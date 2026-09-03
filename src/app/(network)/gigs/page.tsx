import { GigsView } from "@/features/jobs/jobs-gigs";

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; trade?: string }>;
}) {
  const { city, trade } = await searchParams;
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Gigs</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Immediate work — date, shift, location and pay first. Not a job listing.
      </p>
      <GigsView city={city} trade={trade} />
    </div>
  );
}
