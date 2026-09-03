import { CompanyDirectory } from "@/features/company/company-directory";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Companies</h1>
      <CompanyDirectory query={q} type={type} />
    </div>
  );
}
