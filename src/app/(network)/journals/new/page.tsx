import { redirect } from "next/navigation";

export default async function JournalsNewRedirect() {
  redirect("/projects/new");
}
