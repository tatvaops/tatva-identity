import { redirect } from "next/navigation";
import { DocumentVault } from "@/features/passport/document-vault";
import { getAuthContext } from "@/lib/data/query";
import { listProfileDocuments } from "@/lib/data/workspace";

export default async function DocumentsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/passport/documents");
  const documents = await listProfileDocuments(session.userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Documents</h1>
      <p className="text-sm text-muted-foreground">Private files. They are not shown on your public passport.</p>
      <DocumentVault documents={documents.data} />
    </div>
  );
}
