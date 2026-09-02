import { ServiceCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { listAllServices } from "@/lib/data/network";

export default async function ServicesPage() {
  const services = await listAllServices();
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Services</h1>
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
