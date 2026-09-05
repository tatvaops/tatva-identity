import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PassportQr } from "@/components/identity/passport-qr";
import { CoverBand, InitialsAvatar } from "@/components/identity/visuals";
import { EmptyState } from "@/components/states/empty-state";
import { BusinessPassport } from "@/features/company/business-passport";
import { OrganisationCredentials, OrganisationProjectGrid, ServiceCatalogue } from "@/features/company/company-sections";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { organisationTypeLabel } from "@/lib/domain/org-config";
import { product } from "@/lib/config";
import type { NetworkProject, OrgCredential, OrgService, Organisation, PublicProfile } from "@/lib/types/identity";

export async function PublicBusinessPassportView({
  org,
  services,
  credentials,
  projects,
  people,
  origin,
}: {
  org: Organisation;
  services: OrgService[];
  credentials: OrgCredential[];
  projects: NetworkProject[];
  people: PublicProfile[];
  origin: string;
}) {
  const url = `${origin}/org/${org.slug}/passport`;
  const verified = credentials.some((item) => item.verificationState === "verified");
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="overflow-hidden print:shadow-none">
        <CoverBand tone="office" className="h-28" src={org.coverPath} />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <InitialsAvatar initials={initialsFromName(org.name)} hue={hueFromId(org.id)} size={88} className="rounded-2xl ring-4 ring-white" src={org.logoPath} />
            <div className="hidden print:block">
              <PassportQr url={url} />
            </div>
          </div>
          <p className="mt-4 text-[11px] font-semibold tracking-[0.16em] text-indigo-800 uppercase">
            {product.name} business passport
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{org.name}</h1>
          {org.tagline ? <p className="mt-1 text-sm">{org.tagline}</p> : null}
          <p className="mt-2 text-sm text-muted-foreground">
            {organisationTypeLabel(org.type)}
            {org.city ? ` · ${org.city}` : ""}
          </p>
          {verified ? (
            <Badge variant="verify" className="mt-2">
              Business verification on file
            </Badge>
          ) : (
            <p className="mt-2 text-xs text-muted-foreground">Verification has not been completed yet.</p>
          )}
          <div className="mt-4 sm:hidden print:hidden">
            <PassportQr url={url} />
          </div>
        </div>
      </Card>
      {org.about ? (
        <Card className="p-4 text-sm leading-6">{org.about}</Card>
      ) : (
        <EmptyState title="No overview yet" body="This public business passport shows only opted-in company identity." />
      )}
      <BusinessPassport org={org} credentials={credentials} />
      <section>
        <h2 className="mb-3 text-[15px] font-semibold">Services</h2>
        <ServiceCatalogue services={services} />
      </section>
      <section>
        <h2 className="mb-3 text-[15px] font-semibold">Projects</h2>
        <OrganisationProjectGrid projects={projects} />
      </section>
      <section>
        <h2 className="mb-3 text-[15px] font-semibold">Credentials</h2>
        <OrganisationCredentials credentials={credentials} />
      </section>
      {people.length > 0 ? (
        <p className="text-sm text-muted-foreground">{people.length} public people on this organisation.</p>
      ) : null}
    </div>
  );
}
