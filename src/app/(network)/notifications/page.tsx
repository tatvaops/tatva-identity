import { redirect } from "next/navigation";
import { NotificationsView } from "@/features/messaging/notifications-view";
import { MarkAllReadButton } from "@/features/messaging/mark-all-read";
import { getAuthContext } from "@/lib/data/query";
import { listNotifications } from "@/lib/data/network";

export default async function NotificationsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/notifications");
  const items = await listNotifications(session.userId);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Notifications</h1>
        {items.data.some((item) => !item.readAt) ? <MarkAllReadButton /> : null}
      </div>
      <NotificationsView items={items.data} />
    </div>
  );
}
