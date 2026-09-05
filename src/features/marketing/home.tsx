import Link from "next/link";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function MarketingHome() {
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
      <section className="bg-[#0b1f3a] text-white">
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
      <section className="page-wrap grid gap-6 px-4 py-16 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Service and product brands</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Requirement fit, featured projects, labelled AI pulse and a trust breakdown built from public evidence.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/service-brands">Service brands</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/product-brands">Product brands</Link>
            </Button>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">People, shown by work</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Executives with named projects. Gig workers with a photo grid of what they actually built.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/professionals">Professionals</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/gig-workers">Gig workers</Link>
            </Button>
          </div>
        </Card>
      </section>
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
