import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/data/query";
import { personPublicHref } from "@/lib/domain/identiti-routes";

export default async function ProfileShortcutPage() {
  const session = await getAuthContext();
  if (!session.profile) redirect("/onboarding");
  redirect(personPublicHref(session.profile.handle, session.profile.occupationMode));
}
