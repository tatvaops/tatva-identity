import Link from "next/link";
import { GigsView } from "@/features/jobs/jobs-gigs";
import { Button } from "@/components/ui/button";

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; trade?: string; page?: string }>;
}) {
  const { city, trade, page } = await searchParams;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Gigs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Immediate work — date, shift, location and pay first. Not a job listing.
          </p>
        </div>
        <Button asChild>
          <Link href="/gigs/create">Post a gig</Link>
        </Button>
      </div>
      <GigsView city={city} trade={trade} page={Number.parseInt(page ?? "1", 10) || 1} />
    </div>
  );
}
