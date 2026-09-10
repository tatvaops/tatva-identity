import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/section";
import { SiteJournalCreateForm } from "@/features/journals/journal-forms";
import { getAuthContext } from "@/lib/data/query";

export default async function NewSiteJournalPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/journals/new");
  return (
    <div>
      <PageHeader
        eyebrow="Site journals"
        title="Start an execution diary"
        body="Creates a draft journal you can update weekly. Operators publish it after review. This does not create a Vertex site or a verified project passport."
      />
      <SiteJournalCreateForm />
    </div>
  );
}
