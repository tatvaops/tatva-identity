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
}: Readonly<{
  serviceBrands: IdentitiBrand[];
  productBrands: IdentitiBrand[];
  professionals: PublicProfile[];
  gigWorkers: PublicProfile[];
  projects: IdentitiProject[];
  jobs?: JobPost[];
  gigs?: GigPost[];
  posts?: Post[];
}>) {
  const featured = professionals[0] ?? gigWorkers[0] ?? null;
  const supportingPeople = [
    ...professionals.filter((person) => person.id !== featured?.id),
    ...gigWorkers.filter((person) => person.id !== featured?.id),
  ].slice(0, 4);
  const heroProject = projects[0] ?? null;

  return (
    <div>
      <section className="ink-wash relative overflow-hidden text-white">
        <div className="page-wrap relative grid items-end gap-10 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">Tatva IDENTITI</p>
            <h1 className="type-display mt-5 max-w-3xl text-4xl text-white sm:text-5xl lg:text-[3.4rem]">
              Proof-led professional identity for the built world.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/72">
              Passports, delivered work and labelled verification for construction, interiors, manufacturing and allied trades.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild className="bg-white text-ink hover:bg-white/90">
                <Link href="/professionals">Explore the network</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/auth/sign-in">Create your passport</Link>
              </Button>
            </div>
          </div>
          <div className="relative hidden min-h-[280px] lg:block">
            {heroProject ? (
              <Link href={`/projects/${heroProject.slug}`} className="group absolute inset-0 block overflow-hidden">
                <PhotoFrame src={heroProject.coverImageUrl} alt={heroProject.name} className="h-full min-h-[320px]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5">
                  <p className="type-micro text-white/70">Featured proof</p>
                  <p className="mt-1 text-lg font-semibold text-white group-hover:underline">{heroProject.name}</p>
                  <p className="mt-1 text-sm text-white/70">
                    {[heroProject.city, heroProject.valueLabel].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Link>
            ) : featured ? (
              <Link
                href={personPublicHref(featured.handle, featured.occupationMode)}
                className="group absolute inset-0 block overflow-hidden bg-white/5"
              >
                <PhotoFrame
                  src={featured.coverPath || featured.avatarPath}
                  alt={featured.fullName}
                  className="h-full min-h-[320px]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-5">
                  <p className="type-micro text-white/70">Featured passport</p>
                  <p className="mt-1 text-lg font-semibold text-white group-hover:underline">{featured.fullName}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-white/70">{featured.headline}</p>
                </div>
              </Link>
            ) : (
              <div className="absolute inset-0 flex items-end border border-white/10 bg-white/5 p-6">
                <div>
                  <p className="type-micro text-white/55">Evidence first</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">
                    When professionals and brands publish delivered work, it becomes the public proof layer of IDENTITI.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white">
        <div className="page-wrap px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <SearchBox size="page" />
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {[
              ["/service-brands", "Service brands"],
              ["/product-brands", "Product brands"],
              ["/professionals", "Professionals"],
              ["/gig-workers", "Gig workers"],
              ["/projects", "Projects"],
              ["/journals", "Site journals"],
              ["/careers", "Careers"],
              ["/gigs", "Gigs"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap px-4 py-14 sm:px-6">
        <SectionIntro
          eyebrow="Why IDENTITI"
          title="Identity judged by evidence, not a brochure."
          body="Every passport shows what someone claims, what they have delivered, and what has been labelled as verified."
        />
        <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Identity",
              body: "A professional or brand passport with role, location and capability — not a social wall.",
            },
            {
              title: "Evidence",
              body: "Projects, media, certifications and memberships that support claims with first-party proof.",
            },
            {
              title: "Trust",
              body: "Labelled verification for identity, employment and trade. No mysterious score.",
            },
            {
              title: "Opportunity",
              body: "Careers, jobs and gigs connected to real organisations — apply without inventing hiring.",
            },
          ].map((item) => (
            <div key={item.title} className="border-t border-border pt-5">
              <h3 className="text-[15px] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white">
        <div className="page-wrap px-4 py-14 sm:px-6">
          <SectionIntro
            eyebrow="Proof ecosystem"
            title="People, brands, projects and careers in one network."
            body="Discover who works where, what they have delivered, and which roles are open across the Tatva ecosystem."
            actionHref="/search"
            actionLabel="Search the network"
          />
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { href: "/professionals", label: "Professionals", detail: "Career passports and experience" },
              { href: "/gig-workers", label: "Gig workers", detail: "Trade, availability and site work" },
              { href: "/service-brands", label: "Service brands", detail: "Execution capability and delivered projects" },
              { href: "/product-brands", label: "Product brands", detail: "Product families and application proof" },
              { href: "/projects", label: "Projects", detail: "Verified proof of delivered work" },
              { href: "/careers", label: "Careers", detail: "Shareable apply links for open roles" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="lift group border border-border bg-surface-muted/40 px-5 py-5 hover:bg-white"
              >
                <p className="font-semibold tracking-tight group-hover:text-brand">{item.label}</p>
                <p className="mt-1 text-sm text-text-secondary">{item.detail}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="page-wrap px-4 py-14 sm:px-6">
        <SectionHead title="Featured people" href="/professionals" action="View professionals" />
        {!featured && supportingPeople.length === 0 ? (
          <EmptyCopy
            title="People"
            body="No professional passports are public yet. When a person publishes their identity, they appear here."
          />
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            {featured ? <FeaturedPerson person={featured} /> : null}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {supportingPeople.map((person) => (
                <PersonRow key={person.id} person={person} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="page-wrap px-4 py-14 sm:px-6">
        <SectionHead title="Service brands" href="/service-brands" />
        {serviceBrands.length === 0 ? (
          <EmptyCopy
            title="Service brands"
            body="No service brands are public yet. Published organisations appear here with their delivered work."
          />
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {serviceBrands.slice(0, 3).map((brand) => (
              <BrandTile key={brand.id} brand={brand} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-border bg-white">
        <div className="page-wrap px-4 py-14 sm:px-6">
          <SectionHead title="Proof of work" href="/projects" action="View projects" />
          {projects.length === 0 ? (
            <EmptyCopy
              title="Projects"
              body="No delivered work has been added yet. Projects become the evidence layer of a professional or brand passport."
            />
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {projects.slice(0, 3).map((project) => (
                <Link key={project.id} href={`/projects/${project.slug}`} className="group block">
                  <PhotoFrame src={project.coverImageUrl} alt={project.name} className="h-56 md:h-64" />
                  <div className="mt-4">
                    {project.verified ? <Badge variant="verify">Verified project</Badge> : null}
                    <h3 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-brand">{project.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[project.city, project.valueLabel].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="page-wrap px-4 py-14 sm:px-6">
        <SectionIntro
          eyebrow="How it works"
          title="Build a passport. Attach proof. Share with confidence."
          body="IDENTITI does not invent verification or forum threads. It publishes first-party identity and evidence operators and members actually control."
        />
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Create your passport",
              body: "Sign in with WhatsApp OTP and publish the identity sections you choose to make public.",
            },
            {
              step: "02",
              title: "Attach delivered work",
              body: "Add experience, projects, skills and certifications. Evidence stays labelled — claimed, evidence-backed or verified.",
            },
            {
              step: "03",
              title: "Find opportunity",
              body: "Explore careers, jobs and gigs, or let organisations discover you through public proof — not a hidden score.",
            },
          ].map((item) => (
            <li key={item.step} className="border-t border-border pt-5">
              <p className="type-micro text-brand">{item.step}</p>
              <h3 className="mt-2 text-[15px] font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-white">
        <div className="page-wrap grid gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHead title="Open careers" href="/careers" action="View careers" />
            {jobs.length === 0 ? (
              <EmptyCopy title="Careers" body="No open roles are published yet. When HR posts a job, the shareable apply link appears here." />
            ) : (
              <ul className="mt-6 divide-y divide-border">
                {jobs.slice(0, 4).map((job) => (
                  <li key={job.id} className="py-4">
                    <Link href={`/careers/${job.id}`} className="block hover:text-brand">
                      <p className="font-semibold">{job.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
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
              <ul className="mt-6 divide-y divide-border">
                {gigs.slice(0, 4).map((gig) => (
                  <li key={gig.id} className="py-4">
                    <Link href={`/gigs/${gig.id}`} className="block hover:text-brand">
                      <p className="font-semibold">{gig.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
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

      <section className="page-wrap px-4 py-14 sm:px-6">
        <SectionHead title="Gig workers" href="/gig-workers" />
        {gigWorkers.length === 0 ? (
          <EmptyCopy
            title="Gig workers"
            body="No gig-worker passports are public yet. Trade, availability and completed work appear here when published."
          />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gigWorkers.slice(0, 4).map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </div>
        )}
      </section>

      <section className="page-wrap px-4 py-14 sm:px-6">
        <SectionHead title="Product brands" href="/product-brands" />
        {productBrands.length === 0 ? (
          <EmptyCopy title="Product brands" body="No product brands are public yet." />
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productBrands.slice(0, 4).map((brand) => (
              <BrandTile key={brand.id} brand={brand} compact />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-border bg-white">
        <div className="page-wrap px-4 py-14 sm:px-6">
          <SectionHead title="Network activity" href="/feed" action="View feed" />
          {posts.length === 0 ? (
            <EmptyCopy
              title="Activity"
              body="No public posts yet. When people publish updates, they appear here from the live feed."
            />
          ) : (
            <div className="mt-8 grid gap-px bg-border md:grid-cols-2">
              {posts.slice(0, 4).map((post) => (
                <article key={post.id} className="bg-white p-6">
                  <p className="line-clamp-4 text-sm leading-6 text-text-secondary">{post.body}</p>
                  <p className="mt-4 text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                </article>
              ))}
            </div>
          )}
          <div className="mt-10 border border-border bg-surface-muted/50 p-6 sm:p-8">
            <p className="type-micro text-brand">Vantage</p>
            <h2 className="mt-2 type-section">Brand discussion stays on Vantage</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
              IDENTITI maps a brand or product to a Vantage thread. Starting a discussion is signed and never auto-published.
              If no thread exists yet, we show that honestly.
            </p>
            <Button className="mt-5" variant="secondary" asChild>
              <Link href="/forums">Open brand forum</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="ink-wash text-white">
        <div className="page-wrap px-4 py-16 sm:px-6 md:py-20">
          <p className="type-micro text-white/55">Start here</p>
          <h2 className="type-display mt-4 max-w-2xl text-3xl text-white sm:text-4xl">
            Create a professional passport you can share with confidence.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/70">
            Publish identity, attach proof, and keep private documents off the public record.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild className="bg-white text-ink hover:bg-white/90">
              <Link href="/auth/sign-in">Create your passport</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="/careers">Browse careers</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="page-wrap flex flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Tatva</p>
            <p className="mt-1 text-[15px] font-semibold tracking-[0.14em]">IDENTITI</p>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Professional identity, proof of work and opportunity for the Tatva ecosystem.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground">
            <Link href="/auth/sign-in" className="hover:text-foreground">
              Create your passport
            </Link>
            <Link href="/careers" className="hover:text-foreground">
              Careers
            </Link>
            <Link href="/forums" className="hover:text-foreground">
              Brand forum
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  title,
  body,
  actionHref,
  actionLabel,
}: Readonly<{
  eyebrow: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}>) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="type-micro text-brand">{eyebrow}</p>
        <h2 className="type-display mt-3 text-3xl text-foreground sm:text-[2rem]">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-[15px]">{body}</p>
      </div>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className="text-sm font-medium text-brand hover:underline">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function SectionHead({ title, href, action = "View all" }: Readonly<{ title: string; href: string; action?: string }>) {
  return (
    <div className="flex items-end justify-between gap-3">
      <h2 className="type-section">{title}</h2>
      <Link href={href} className="text-sm font-medium text-brand hover:underline">
        {action}
      </Link>
    </div>
  );
}

function EmptyCopy({ title, body }: Readonly<{ title: string; body: string }>) {
  return (
    <div className="mt-6 border border-dashed border-border-strong bg-surface-muted/40 px-5 py-8">
      <p className="type-micro">{title}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">{body}</p>
    </div>
  );
}

function FeaturedPerson({ person }: Readonly<{ person: PublicProfile }>) {
  return (
    <Link
      href={personPublicHref(person.handle, person.occupationMode)}
      className="group block overflow-hidden border border-border bg-white"
    >
      <PhotoFrame src={person.coverPath || person.avatarPath} alt="" className="h-64" />
      <div className="flex items-start gap-4 p-5 sm:p-6">
        <InitialsAvatar
          initials={initialsFromName(person.fullName)}
          hue={hueFromId(person.id)}
          size={64}
          src={person.avatarPath}
        />
        <div className="min-w-0">
          <p className="type-micro">Professional passport</p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight group-hover:text-brand">{person.fullName}</h3>
          <p className="mt-1 text-sm text-text-secondary">{person.headline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <AvailabilityBadge status={person.availabilityStatus} />
            {person.city ? <span className="text-xs text-muted-foreground">{person.city}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function PersonRow({ person }: Readonly<{ person: PublicProfile }>) {
  return (
    <Link
      href={personPublicHref(person.handle, person.occupationMode)}
      className="lift flex items-start gap-3 border border-border bg-white p-4"
    >
      <InitialsAvatar
        initials={initialsFromName(person.fullName)}
        hue={hueFromId(person.id)}
        size={48}
        src={person.avatarPath}
      />
      <div className="min-w-0">
        <p className="truncate font-semibold">{person.fullName}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-text-secondary">{person.headline || person.city}</p>
      </div>
    </Link>
  );
}

function BrandTile({ brand, compact = false }: Readonly<{ brand: IdentitiBrand; compact?: boolean }>) {
  return (
    <Link href={brandPublicHref(brand.passportKind, brand.slug)} className="group block overflow-hidden border border-border bg-white">
      <PhotoFrame src={brand.coverPath} alt="" className={compact ? "h-32" : "h-44"} />
      <div className="p-4">
        <h3 className="font-semibold tracking-tight group-hover:text-brand">{brand.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{brand.tagline || brand.city}</p>
      </div>
    </Link>
  );
}
