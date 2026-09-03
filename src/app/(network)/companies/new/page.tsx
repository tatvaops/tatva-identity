import { redirect } from "next/navigation";
import { OrganisationForm } from "@/features/company/org-forms";
import { getAuthContext } from "@/lib/data/query";

export default async function NewCompanyPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/companies/new");
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Create organisation</h1>
      <p className="text-sm text-muted-foreground">This becomes the public business passport. Operational Vertex data is not created here.</p>
      <OrganisationForm />
    </div>
  );
}
