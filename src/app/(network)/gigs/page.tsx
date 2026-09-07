import Link from "next/link";
import { GigsView } from "@/features/jobs/jobs-gigs";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/section";

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; trade?: string; page?: string }>;
}) {
  const { city, trade, page } = await searchParams;
  return (
    <div>
      <PageHeader
        eyebrow="Opportunity"
        title="Gigs"
        body="Immediate work — trade, date, shift, location, seats and rate first."
        action={
          <Button asChild>
            <Link href="/gigs/create">Post a gig</Link>
          </Button>
        }
      />
      <GigsView city={city} trade={trade} page={Number.parseInt(page ?? "1", 10) || 1} />
    </div>
  );
}
