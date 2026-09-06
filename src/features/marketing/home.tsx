import Link from "next/link";
import { Wordmark } from "@/components/layout/app-shell";
import { PhotoFrame } from "@/components/identity/media-photo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brandPublicHref, personPublicHref } from "@/lib/domain/identiti-routes";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import type { PublicProfile } from "@/lib/types/identity";

export function MarketingHome({
  serviceBrands,
  productBrands,
  professionals,
  gigWorkers,
  projects,
}: {
  serviceBrands: IdentitiBrand[];
  productBrands: IdentitiBrand[];
  professionals: PublicProfile[];
  gigWorkers: PublicProfile[];
  projects: IdentitiProject[];
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="page-wrap flex h-14 items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/service-brands">Browse brands</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-in">Create your profile</Link>
            </Button>
          </div>
        </div>
      </header>
      <section className="bg-[#111a42] text-white">
        <div className="page-wrap px-4 py-16 md:py-24">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/70">Tatva IDENTITI</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
            Proof-led identities for service brands, products, professionals and gig workers.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Judge delivered work, labelled reviews and public evidence — not a brochure or a hidden score. Discussions
            stay on Vantage Forums.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/service-brands">Explore service brands</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10" asChild>
              <Link href="/auth/sign-in">Create your profile</Link>
            </Button>
          </div>
        </div>
      </section>
      <LiveStrip
        title="Service brands"
        href="/service-brands"
        empty="No service brands are public yet."
        items={serviceBrands.slice(0, 4).map((brand) => ({
          id: brand.id,
          href: brandPublicHref(brand.passportKind, brand.slug),
          title: brand.name,
          body: brand.tagline || brand.city,
          photo: brand.coverPath,
        }))}
      />
      <LiveStrip
        title="Product brands"
        href="/product-brands"
        empty="No product brands are public yet."
        items={productBrands.slice(0, 4).map((brand) => ({
          id: brand.id,
          href: brandPublicHref(brand.passportKind, brand.slug),
          title: brand.name,
          body: brand.tagline || brand.city,
          photo: brand.coverPath,
        }))}
      />
      <LiveStrip
        title="Featured projects"
        href="/projects"
        empty="No public projects with photos yet."
        items={projects.slice(0, 4).map((project) => ({
          id: project.id,
          href: `/projects/${project.slug}`,
          title: project.name,
          body: [project.city, project.valueLabel].filter(Boolean).join(" · "),
          photo: project.coverImageUrl,
        }))}
      />
      <LiveStrip
        title="Professionals"
        href="/professionals"
        empty="No professional profiles are public yet."
        items={professionals.slice(0, 4).map((person) => ({
          id: person.id,
          href: personPublicHref(person.handle, person.occupationMode),
          title: person.fullName,
          body: person.headline || person.city,
          photo: person.avatarPath,
        }))}
      />
      <LiveStrip
        title="Gig workers"
        href="/gig-workers"
        empty="No gig-worker profiles are public yet."
        items={gigWorkers.slice(0, 4).map((person) => ({
          id: person.id,
          href: personPublicHref(person.handle, person.occupationMode),
          title: person.fullName,
          body: person.headline || person.city,
          photo: person.avatarPath,
        }))}
      />
      <section className="page-wrap px-4 pb-20">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Brand forum</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            IDENTITI maps a brand or product to a Vantage thread. Starting a discussion is signed and never auto-published.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/forums">Open forum index</Link>
          </Button>
        </Card>
      </section>
    </div>
  );
}

function LiveStrip({
  title,
  href,
  empty,
  items,
}: {
  title: string;
  href: string;
  empty: string;
  items: { id: string; href: string; title: string; body: string | null; photo: string | null }[];
}) {
  return (
    <section className="page-wrap px-4 py-10">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href={href} className="text-sm text-primary hover:underline">
          View all
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Link key={item.id} href={item.href}>
              <Card className="overflow-hidden">
                <PhotoFrame src={item.photo} alt="" className="h-36" />
                <div className="p-4">
                  <p className="font-semibold">{item.title}</p>
                  {item.body ? <p className="mt-1 text-sm text-muted-foreground">{item.body}</p> : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
