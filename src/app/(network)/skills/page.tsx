import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listSkillsCatalog } from "@/lib/data/network";

export default async function SkillsPage() {
  const skills = await listSkillsCatalog();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Skills</h1>
      <QueryNotice configured={skills.meta.configured} error={skills.meta.error} />
      {skills.data.length === 0 ? (
        <EmptyState title="No skills in the catalogue yet" body="Skills become searchable when they are added to the network." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.data.map((s) => (
            <Link key={s.id} href={`/search?q=${encodeURIComponent(s.name)}`}>
              <Card className="p-4 hover:border-primary/40">
                <p className="text-sm font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.category}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
