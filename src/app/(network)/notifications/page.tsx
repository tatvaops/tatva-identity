import { redirect } from "next/navigation";
import { NotificationsView } from "@/features/messaging/notifications-view";
import { getAuthContext } from "@/lib/data/query";
import { listNotifications } from "@/lib/data/network";

export default async function NotificationsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/notifications");
  const items = await listNotifications(session.userId);
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Notifications</h1>
      <NotificationsView items={items.data} />
    </div>
  );
}
