import Link from "next/link";
import { CompanyCard, PersonCard } from "@/components/cards/entity-cards";
import { PhotoFrame } from "@/components/identity/media-photo";
import { VerificationBadge } from "@/components/identity/verification";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import type { IdentitiBrand } from "@/lib/data/identiti";
import type { NetworkProject, Organisation, Post, ProjectMedia, PublicProfile } from "@/lib/types/identity";

function orgHref(org: Organisation) {
  return brandPublicHref(org.passportKind ?? "other", org.slug);
}

export function ProjectProfileView({
  project,
  client,
  main,
  contributors,
  companies,
  updates,
  gallery,
  products,
}: {
  project: NetworkProject;
  client: Organisation | null;
  main: Organisation | null;
  contributors: PublicProfile[];
  companies: Organisation[];
  updates: Post[];
  gallery: ProjectMedia[];
  products: {
    id: string;
    application: string | null;
    location: string | null;
    product: { id: string; slug: string; name: string } | null;
    brand: IdentitiBrand | null;
  }[];
}) {
  const photos = gallery.filter((item) => Boolean(item.storagePath));
  const cover = project.coverImageUrl ?? photos[0]?.storagePath ?? null;
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <PhotoFrame src={cover} alt="" className="h-56 md:h-72" />
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {project.verified && (
              <VerificationBadge
                flag={{
                  kind: "project",
                  state: "verified",
                  label: "Project verified",
                  explanation: "Scope, companies and opted-in contributors are evidenced.",
                }}
              />
            )}
            <Badge>{project.status.replace("_", " ")}</Badge>
            {project.type && <Badge variant="outline">{project.type}</Badge>}
            {project.valueLabel ? <Badge variant="outline">{project.valueLabel}</Badge> : null}
            {project.durationLabel ? <Badge variant="outline">{project.durationLabel}</Badge> : null}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[project.locality, project.city].filter(Boolean).join(", ")}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6">{project.summary}</p>
          <p className="mt-3 text-sm">
            {client && (
              <>
                Client:{" "}
                <Link className="text-primary" href={orgHref(client)}>
                  {client.name}
                </Link>
              </>
            )}
            {main && (
              <>
                {" · "}Main contractor:{" "}
                <Link className="text-primary" href={orgHref(main)}>
                  {main.name}
                </Link>
              </>
            )}
          </p>
          {project.youtubeUrl ? (
            <p className="mt-3 text-sm">
              <a href={project.youtubeUrl} target="_blank" rel="noreferrer" className="text-primary underline">
                Watch project walkthrough
              </a>
            </p>
          ) : null}
        </div>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="milestones">Evidence</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-3">
          <Card className="p-4 text-sm">{project.summary ?? "No overview yet."}</Card>
          {project.qcNotes ? (
            <Card className="p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">QC notes</p>
              <p className="mt-2">{project.qcNotes}</p>
            </Card>
          ) : null}
          {project.testimonial ? (
            <Card className="p-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Client note</p>
              <p className="mt-2">{project.testimonial}</p>
            </Card>
          ) : null}
        </TabsContent>
        <TabsContent value="updates" className="space-y-3">
          {updates.length === 0 ? (
            <EmptyState title="No updates yet" body="Project posts will appear here." />
          ) : (
            updates.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>
        <TabsContent value="team" className="grid gap-3 sm:grid-cols-2">
          {contributors.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title="No public contributors yet" body="People who opt in will appear on this project." />
            </div>
          )}
          {contributors.map((p) => (
            <PersonCard key={p.id} profile={p} />
          ))}
        </TabsContent>
        <TabsContent value="companies" className="grid gap-3 sm:grid-cols-2">
          {companies.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title="No companies linked yet" body="Clients, contractors and vendors will list here." />
            </div>
          )}
          {companies.map((o) => (
            <CompanyCard key={o.id} org={o} />
          ))}
        </TabsContent>
        <TabsContent value="products" className="grid gap-3 sm:grid-cols-2">
          {products.length === 0 ? (
            <div className="sm:col-span-2">
              <EmptyState title="No products recorded" body="When a product brand is used on this project, it appears here." />
            </div>
          ) : (
            products.map((row) => {
              const href =
                row.brand && row.product
                  ? `/product-brands/${row.brand.slug}/products/${row.product.slug}`
                  : row.brand
                    ? brandPublicHref(row.brand.passportKind, row.brand.slug)
                    : null;
              const body = (
                <Card className="p-4">
                  <p className="font-semibold">{row.product?.name ?? "Product"}</p>
                  <p className="text-sm text-muted-foreground">
                    {[row.brand?.name, row.application, row.location].filter(Boolean).join(" · ")}
                  </p>
                </Card>
              );
              return href ? (
                <Link key={row.id} href={href}>
                  {body}
                </Link>
              ) : (
                <div key={row.id}>{body}</div>
              );
            })
          )}
        </TabsContent>
        <TabsContent value="gallery">
          {photos.length === 0 && !cover ? (
            <EmptyState title="No gallery yet" body="Project photos appear here when contributors opt them in. Sensitive site data stays private." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {cover ? <PhotoFrame src={cover} alt="" className="h-52 rounded-2xl" /> : null}
              {photos
                .filter((item) => item.storagePath !== cover)
                .map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-2xl border border-border">
                    <PhotoFrame src={item.storagePath} alt="" className="h-52" />
                    {item.caption ? <figcaption className="p-3 text-sm text-muted-foreground">{item.caption}</figcaption> : null}
                  </figure>
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="milestones">
          {project.qcNotes || project.testimonial ? (
            <div className="space-y-3">
              {project.qcNotes ? <Card className="p-4 text-sm">{project.qcNotes}</Card> : null}
              {project.testimonial ? <Card className="p-4 text-sm">{project.testimonial}</Card> : null}
            </div>
          ) : (
            <EmptyState title="No evidence notes yet" body="Verified QC notes and client comments appear here when recorded." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
