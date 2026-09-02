import Link from "next/link";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { product } from "@/lib/config";

export function MarketingHome() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-white">
        <div className="page-wrap flex h-14 items-center justify-between px-4">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/feed">Open network</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-in">Create your profile</Link>
            </Button>
          </div>
        </div>
      </header>
      <section className="page-wrap px-4 py-16 md:py-24">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Work network</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl">
          Your work. Your reputation. Your professional identity.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Build a verified professional identity that follows you across jobs, gigs, companies and projects.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/sign-in">Create your profile</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/people">Explore professionals</Link>
          </Button>
        </div>
      </section>
      <section className="page-wrap grid gap-6 px-4 pb-16 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Professional passport</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Identity, employment, skills, credentials, project history and references — shown as transparent checks, not
            a hidden employability score.
          </p>
        </Card>
        <Card className="p-6">
          <h2 className="text-lg font-semibold">Build your verified business identity</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Services, verified projects, associated professionals and credentials — a business passport, not a brochure
            page.
          </p>
          <Button className="mt-4" variant="outline" asChild>
            <Link href="/companies">Browse organisations</Link>
          </Button>
        </Card>
      </section>
      <section className="page-wrap grid gap-6 px-4 pb-20 md:grid-cols-3">
        <Link href="/jobs" className="surface-card p-6 hover:border-primary/30">
          <h2 className="text-lg font-semibold">Jobs</h2>
          <p className="mt-2 text-sm text-muted-foreground">Permanent and contract roles from organisations on the network.</p>
        </Link>
        <Link href="/gigs" className="surface-card p-6 hover:border-primary/30">
          <h2 className="text-lg font-semibold">Gigs</h2>
          <p className="mt-2 text-sm text-muted-foreground">Shift and day work, distinct from jobs.</p>
        </Link>
        <Link href="/projects" className="surface-card p-6 hover:border-primary/30">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="mt-2 text-sm text-muted-foreground">First-class project identity linking people and companies.</p>
        </Link>
        <p className="text-xs text-muted-foreground md:col-span-3">
          {product.name} is the professional identity layer of the {product.ecosystem} ecosystem. Site control stays in
          Ops / Vertex when those systems are connected.
        </p>
      </section>
    </div>
  );
}
