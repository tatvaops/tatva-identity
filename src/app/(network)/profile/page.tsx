import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/data/query";

export default async function ProfileShortcutPage() {
  const session = await getAuthContext();
  if (!session.profile) redirect("/auth/sign-in?next=/profile");
  redirect(`/people/${session.profile.handle}`);
}
