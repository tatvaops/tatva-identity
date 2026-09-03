import Link from "next/link";
import { ServiceCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { Button } from "@/components/ui/button";
import { listAllServices } from "@/lib/data/network";

export default async function ServicesPage() {
  const services = await listAllServices();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Services</h1>
        <Button variant="outline" asChild>
          <Link href="/companies/new">Add a business catalogue</Link>
        </Button>
      </div>
      <QueryNotice configured={services.meta.configured} error={services.meta.error} />
      {services.data.length === 0 ? (
        <EmptyState title="No services yet" body="Organisation service catalogues will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.data.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  );
}
