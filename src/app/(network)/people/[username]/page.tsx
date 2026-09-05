import { notFound, redirect } from "next/navigation";
import { getProfileByHandle } from "@/lib/data/profile";
import { QueryNotice } from "@/components/states/empty-state";
import { personPublicHref } from "@/lib/domain/identiti-routes";

export default async function PersonPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getProfileByHandle(username);
  if (profile.meta.error) {
    return <QueryNotice configured={profile.meta.configured} error={profile.meta.error} />;
  }
  if (!profile.data) {
    if (!profile.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  redirect(personPublicHref(profile.data.handle, profile.data.occupationMode));
}
