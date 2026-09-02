import { CompanyCard } from "@/components/cards/entity-cards";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listOrganisations } from "@/lib/data/network";

export async function CompanyDirectory({ query }: { query?: string }) {
  const orgs = await listOrganisations(query);
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form method="get">
          <Input name="q" defaultValue={query} placeholder="Search companies, services or industries" />
        </form>
      </Card>
      <QueryNotice configured={orgs.meta.configured} error={orgs.meta.error} />
      {orgs.data.length === 0 ? (
        <EmptyState title="No organisations yet" body="Verified businesses will appear in this directory." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.data.map((o) => (
            <CompanyCard key={o.id} org={o} />
          ))}
        </div>
      )}
    </div>
  );
}
