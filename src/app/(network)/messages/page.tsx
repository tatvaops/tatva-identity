import { redirect } from "next/navigation";
import { MessagesView } from "@/features/messaging/messages-view";
import { getAuthContext } from "@/lib/data/query";
import { getOrganisationBySlug, listConversations, listMessages, listPublicProfiles } from "@/lib/data/network";
import { startOrGetOrgConversation, startOrGetPersonConversation } from "@/lib/actions/messaging";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; person?: string; org?: string; q?: string }>;
}) {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/messages");
  const { c, person, org, q } = await searchParams;
  if (person) {
    const started = await startOrGetPersonConversation(person);
    if (started.ok && started.id) redirect(`/messages?c=${started.id}`);
  }
  if (org) {
    const organisation = await getOrganisationBySlug(org);
    const started = await startOrGetOrgConversation(organisation.data?.id ?? org, organisation.data?.createdBy ?? null);
    if (started.ok && started.id) redirect(`/messages?c=${started.id}`);
  }
  const convos = await listConversations(session.userId);
  const activeId = c ?? convos.data[0]?.id ?? null;
  const messages = activeId ? await listMessages(activeId) : { data: [] };
  const people = q ? await listPublicProfiles({ query: q }, { pageSize: 8 }) : { data: [] };
  return (
    <MessagesView
      conversations={convos.data}
      activeId={activeId}
      messages={messages.data}
      selfId={session.userId}
      people={people.data.filter((person) => person.id !== session.userId)}
      peopleQuery={q ?? ""}
    />
  );
}
