import { redirect } from "next/navigation";
import { NotificationsView } from "@/features/messaging/notifications-view";
import { MarkAllReadButton } from "@/features/messaging/mark-all-read";
import { PageHeader } from "@/components/ui/section";
import { getAuthContext } from "@/lib/data/query";
import { listNotifications } from "@/lib/data/network";

export default async function NotificationsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/notifications");
  const items = await listNotifications(session.userId);
  return (
    <div>
      <PageHeader
        title="Notifications"
        body="Follows, applications, messages and verification updates from the live network."
        action={items.data.some((item) => !item.readAt) ? <MarkAllReadButton /> : undefined}
      />
      <NotificationsView items={items.data} />
    </div>
  );
}
