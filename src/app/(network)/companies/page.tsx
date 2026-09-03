import Link from "next/link";
import { CompanyDirectory } from "@/features/company/company-directory";
import { Button } from "@/components/ui/button";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  const { q, type, page } = await searchParams;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Companies</h1>
        <Button asChild>
          <Link href="/companies/new">Create organisation</Link>
        </Button>
      </div>
      <CompanyDirectory query={q} type={type} page={Number.parseInt(page ?? "1", 10) || 1} />
    </div>
  );
}
