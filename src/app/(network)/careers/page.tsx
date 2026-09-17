import type { Metadata } from "next";
import Link from "next/link";
import { JobsView } from "@/features/jobs/jobs-gigs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Careers",
  description: "Open roles across construction, interiors, manufacturing and allied organisations on Tatva IDENTITI.",
};

export default async function CareersPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ city?: string; type?: string; page?: string }>;
}>) {
  const { city, type, page } = await searchParams;
  return (
    <div className="space-y-8">
      <section className="ink-wash overflow-hidden px-5 py-10 text-white sm:px-8 sm:py-12">
        <p className="type-micro text-white/55">Tatva careers</p>
        <h1 className="type-display mt-4 max-w-3xl text-3xl text-white sm:text-4xl">
          Open roles for the built world.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/72 sm:text-[15px]">
          A global careers portal for construction, interiors, manufacturing and allied organisations. Every listing
          has a stable apply link you can share on LinkedIn and job boards.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-white text-ink hover:bg-white/90">
            <Link href="/auth/sign-in?next=/careers">Sign in to apply</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
            <Link href="/professionals">Build your passport</Link>
          </Button>
        </div>
      </section>
      <JobsView
        city={city}
        employmentType={type}
        page={Number.parseInt(page ?? "1", 10) || 1}
        basePath="/careers"
      />
    </div>
  );
}
