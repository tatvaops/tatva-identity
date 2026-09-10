import Link from "next/link";
import { PhotoFrame } from "@/components/identity/media-photo";
import { InitialsAvatar } from "@/components/identity/visuals";
import { AvailabilityBadge } from "@/components/identity/verification";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchBox } from "@/features/search/search-box";
import { brandPublicHref, personPublicHref } from "@/lib/domain/identiti-routes";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import type { GigPost, JobPost, Post, PublicProfile } from "@/lib/types/identity";

export function MarketingHome({
  serviceBrands,
  productBrands,
  professionals,
  gigWorkers,
  projects,
  jobs = [],
  gigs = [],
  posts = [],
}: {
  serviceBrands: IdentitiBrand[];
  productBrands: IdentitiBrand[];
  professionals: PublicProfile[];
  gigWorkers: PublicProfile[];
  projects: IdentitiProject[];
  jobs?: JobPost[];
  gigs?: GigPost[];
  posts?: Post[];
}) {
  const featured = professionals[0] ?? gigWorkers[0] ?? null;
  const supporting = professionals.slice(featured && professionals[0] ? 1 : 0, featured && professionals[0] ? 4 : 3);
  return (
    <div>
      <section className="identiti-grid text-white">
        <div className="page-wrap px-4 py-14 sm:px-6 md:py-20">
          <p className="type-micro text-white/60">Tatva IDENTITI</p>
          <h1 className="type-display mt-3 max-w-3xl text-4xl text-white sm:text-5xl">
            The professional identity network for construction, interiors, manufacturing and allied trades.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">
            Passports, proof of work, labelled verification and live opportunities — judged by evidence, not a brochure.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox size="page" />
          </div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/70">
            {[
              ["/professionals", "Professionals"],
              ["/gig-workers", "Gig workers"],
              ["/service-brands", "Service brands"],
              ["/product-brands", "Product brands"],
              ["/projects", "Projects"],
              ["/journals", "Site journals"],
              ["/jobs", "Jobs"],
              ["/gigs", "Gigs"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-white">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap px-4 py-12 sm:px-6">
        <SectionHead title="People" href="/professionals" action="View professionals" />
        {!featured && supporting.length === 0 ? (
          <EmptyCopy title="People" body="No professional passports are public yet. When a person publishes their identity, they appear here." />
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {featured ? <FeaturedPerson person={featured} /> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {supporting.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="page-wrap px-4 py-12 sm:px-6">
        <SectionHead title="Service brands" href="/service-brands" />
        {serviceBrands.length === 0 ? (
          <EmptyCopy title="Service brands" body="No service brands are public yet. Published organisations appear here with their delivered work." />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {serviceBrands.slice(0, 3).map((brand) => (
              <BrandTile key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </section>

      <section className="page-wrap px-4 py-12 sm:px-6">
        <SectionHead title="Proof of work" href="/projects" action="View projects" />
        {projects.length === 0 ? (
          <EmptyCopy title="Projects" body="No delivered work has been added yet. Projects become the evidence layer of a professional or brand passport." />
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {projects.slice(0, 3).map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`} className="group block">
                <PhotoFrame src={project.coverImageUrl} alt={project.name} className="h-56 md:h-64" />
                <div className="mt-3">
                  {project.verified ? <Badge variant="verify">Verified project</Badge> : null}
                  <h3 className="mt-1.5 text-lg font-semibold tracking-tight group-hover:text-brand">{project.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{[project.city, project.valueLabel].filter(Boolean).join(" · ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-border bg-white">
        <div className="page-wrap grid gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHead title="Open jobs" href="/jobs" />
            {jobs.length === 0 ? (
              <EmptyCopy title="Jobs" body="No open jobs are published yet." />
            ) : (
              <ul className="mt-5 divide-y divide-border">
                {jobs.slice(0, 4).map((job) => (
                  <li key={job.id} className="py-3">
                    <Link href={`/jobs/${job.id}`} className="block hover:text-brand">
                      <p className="font-semibold">{job.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[job.city, job.employmentType.replaceAll("_", " "), job.salaryLabel].filter(Boolean).join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <SectionHead title="Open gigs" href="/gigs" />
            {gigs.length === 0 ? (
              <EmptyCopy title="Gigs" body="No open gigs are published yet." />
            ) : (
              <ul className="mt-5 divide-y divide-border">
                {gigs.slice(0, 4).map((gig) => (
                  <li key={gig.id} className="py-3">
                    <Link href={`/gigs/${gig.id}`} className="block hover:text-brand">
                      <p className="font-semibold">{gig.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {[gig.trade, gig.siteName, gig.payLabel].filter(Boolean).join(" · ")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="page-wrap px-4 py-12 sm:px-6">
        <SectionHead title="Gig workers" href="/gig-workers" />
        {gigWorkers.length === 0 ? (
          <EmptyCopy title="Gig workers" body="No gig-worker passports are public yet. Trade, availability and completed work appear here when published." />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gigWorkers.slice(0, 4).map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        )}
      </section>

      <section className="page-wrap px-4 py-12 sm:px-6">
        <SectionHead title="Product brands" href="/product-brands" />
        {productBrands.length === 0 ? (
          <EmptyCopy title="Product brands" body="No product brands are public yet." />
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productBrands.slice(0, 4).map((brand) => (
              <BrandTile key={brand.id} brand={brand} compact />
            ))}
          </div>
        )}
      </section>

      <section className="page-wrap px-4 py-12 sm:px-6">
        <SectionHead title="Network activity" href="/feed" action="View feed" />
        {posts.length === 0 ? (
          <EmptyCopy title="Activity" body="No public posts yet. When people publish updates, they appear here from the live feed." />
        ) : (
          <div className="mt-6 grid gap-px bg-border md:grid-cols-2">
            {posts.slice(0, 4).map((post) => (
              <article key={post.id} className="bg-white p-5">
                <p className="line-clamp-4 text-sm leading-6 text-text-secondary">{post.body}</p>
                <p className="mt-3 text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
              </article>
            ))}
          </div>
        )}
        <div className="mt-8 border border-border bg-white p-6">
          <p className="type-micro text-brand">Vantage</p>
          <h2 className="mt-1 type-section">Brand discussion</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
            IDENTITI maps a brand or product to a Vantage thread. Starting a discussion is signed and never auto-published.
          </p>
          <Button className="mt-4" variant="secondary" asChild>
            <Link href="/forums">Open forum index</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="page-wrap flex flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[15px] font-semibold tracking-[0.14em]">IDENTITI</p>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Professional identity, proof of work and opportunity for the Tatva ecosystem.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/auth/sign-in" className="hover:text-foreground">
              Create your passport
            </Link>
            <Link href="/jobs" className="hover:text-foreground">
              Opportunities
            </Link>
            <Link href="/forums" className="hover:text-foreground">
              Vantage
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ title, href, action = "View all" }: { title: string; href: string; action?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="type-section">{title}</h2>
      <Link href={href} className="text-sm font-medium text-brand hover:underline">
        {action}
      </Link>
    </div>
  );
}

function EmptyCopy({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-5 border border-dashed border-border-strong px-5 py-8">
      <p className="type-micro">{title}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">{body}</p>
    </div>
  );
}

function FeaturedPerson({ person }: { person: PublicProfile }) {
  return (
    <Link href={personPublicHref(person.handle, person.occupationMode)} className="group block border border-border bg-white">
      <PhotoFrame src={person.coverPath || person.avatarPath} alt="" className="h-64" />
      <div className="flex items-start gap-4 p-5">
        <InitialsAvatar initials={initialsFromName(person.fullName)} hue={hueFromId(person.id)} size={64} src={person.avatarPath} />
        <div className="min-w-0">
          <p className="type-micro">Professional</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight group-hover:text-brand">{person.fullName}</h3>
          <p className="mt-1 text-sm text-text-secondary">{person.headline}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <AvailabilityBadge status={person.availabilityStatus} />
            {person.city ? <span className="text-xs text-muted-foreground">{person.city}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PersonRow({ person }: { person: PublicProfile }) {
  return (
    <Link href={personPublicHref(person.handle, person.occupationMode)} className="flex items-start gap-3 border border-border bg-white p-4 hover:border-border-strong">
      <InitialsAvatar initials={initialsFromName(person.fullName)} hue={hueFromId(person.id)} size={48} src={person.avatarPath} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{person.fullName}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{person.headline || person.city}</p>
      </div>
    </Link>
  );
}

function BrandTile({ brand, compact = false }: { brand: IdentitiBrand; compact?: boolean }) {
  return (
    <Link href={brandPublicHref(brand.passportKind, brand.slug)} className="group block border border-border bg-white">
      <PhotoFrame src={brand.coverPath} alt="" className={compact ? "h-32" : "h-40"} />
      <div className="p-4">
        <h3 className="font-semibold tracking-tight group-hover:text-brand">{brand.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{brand.tagline || brand.city}</p>
      </div>
    </Link>
  );
}
