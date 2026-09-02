import { GigsView } from "@/features/jobs/jobs-gigs";

export default function GigsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Gigs</h1>
      <p className="mb-4 text-sm text-muted-foreground">Short work is not a job. Accepting a gig later creates a Vertex engagement.</p>
      <GigsView />
    </div>
  );
}
