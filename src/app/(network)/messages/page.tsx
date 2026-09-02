import { redirect } from "next/navigation";
import { MessagesView } from "@/features/messaging/messages-view";
import { getAuthContext } from "@/lib/data/query";
import { listConversations, listMessages } from "@/lib/data/network";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/messages");
  const { c } = await searchParams;
  const convos = await listConversations(session.userId);
  const activeId = c ?? convos.data[0]?.id ?? null;
  const messages = activeId ? await listMessages(activeId) : { data: [] };
  return (
    <MessagesView
      conversations={convos.data}
      activeId={activeId}
      messages={messages.data}
      selfId={session.userId}
    />
  );
}
