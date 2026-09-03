import { CompanyCard } from "@/components/cards/entity-cards";
import { FilterDrawer } from "@/components/layout/filter-drawer";
import { Input } from "@/components/ui/input";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listOrganisations } from "@/lib/data/network";

export async function CompanyDirectory({
  query,
  type,
}: {
  query?: string;
  type?: string;
}) {
  const orgs = await listOrganisations(query, type);
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <FilterDrawer title="Filters">
        <form method="get" className="h-fit space-y-5 rounded-2xl border border-border bg-white p-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Organisation</legend>
            <label className="sr-only" htmlFor="org-q">
              Search companies
            </label>
            <Input id="org-q" name="q" defaultValue={query} placeholder="Name, service or industry" />
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Type</legend>
            <label className="sr-only" htmlFor="org-type">
              Organisation type
            </label>
            <select
              id="org-type"
              name="type"
              defaultValue={type}
              className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm"
            >
              <option value="">Any type</option>
              <option value="employer">Employer</option>
              <option value="service_provider">Service provider</option>
              <option value="vendor">Vendor</option>
              <option value="subcontractor">Subcontractor</option>
              <option value="staffing_agency">Staffing agency</option>
              <option value="general_contractor">General contractor</option>
              <option value="consultancy">Consultancy</option>
            </select>
          </fieldset>
          <button type="submit" className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-white">
            Apply filters
          </button>
        </form>
      </FilterDrawer>
      <div>
        <QueryNotice configured={orgs.meta.configured} error={orgs.meta.error} />
        {orgs.data.length === 0 ? (
          <EmptyState title="No organisations yet" body="Verified businesses will appear in this directory." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {orgs.data.map((o) => (
              <CompanyCard key={o.id} org={o} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
