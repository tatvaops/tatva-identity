import { redirect } from "next/navigation";

export default async function NewProjectJournalRedirect() {
  redirect("/journals/new");
}
