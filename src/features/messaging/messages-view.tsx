"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { InitialsAvatar } from "@/components/identity/visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { sendMessage } from "@/lib/actions/network";
import { markMessagesRead, startOrGetPersonConversation } from "@/lib/actions/messaging";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { cn } from "@/lib/utils";
import type { ConversationSummary, MessageRow, PublicProfile } from "@/lib/types/identity";

const KIND_COPY: Record<string, { label: string; body: string }> = {
  person: {
    label: "Person",
    body: "This thread is attached to a professional identity.",
  },
  organisation: {
    label: "Organisation",
    body: "This thread is attached to a business identity.",
  },
  job: {
    label: "Job",
    body: "This conversation is about a longer-term role. Application state lives on the job page.",
  },
  gig: {
    label: "Gig",
    body: "This conversation is about immediate work. Shift details live on the gig page.",
  },
  enquiry: {
    label: "Vendor request",
    body: "This is a contact or vendor request on IDENTITI. A Vertex quote is a separate path and is not connected here.",
  },
  quote: {
    label: "Quote",
    body: "Quote fulfilment lives in Vertex. This thread is only the IDENTITI conversation around it.",
  },
};

export function MessagesView({
  conversations,
  activeId,
  messages,
  selfId,
  people = [],
  peopleQuery = "",
  startError = null,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  messages: MessageRow[];
  selfId: string;
  people?: PublicProfile[];
  peopleQuery?: string;
  startError?: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(startError);
  const [pending, start] = useTransition();
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;
  const currentId = active?.id ?? null;

  useEffect(() => {
    if (!currentId) return;
    void markMessagesRead(currentId);
  }, [currentId]);

  const kind = KIND_COPY[active?.kind ?? ""] ?? {
    label: active?.kind ? active.kind.replaceAll("_", " ") : "Conversation",
    body: "Context for this thread appears here when it is linked to a person, organisation, job, gig or project.",
  };

  return (
    <div className="space-y-4">
      <CardPicker
        people={people}
        peopleQuery={peopleQuery}
        pending={pending}
        start={start}
        setError={setError}
      />
      {conversations.length === 0 ? (
        <EmptyState
          title="Messages"
          body="Search for a professional above, or open Message on a public profile. Threads are created in the database when you start them."
        />
      ) : (
        <div className="grid h-[calc(100vh-11rem)] overflow-hidden border border-border bg-white lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-r border-border">
            <ul>
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-muted",
                      c.id === currentId && "bg-secondary/60",
                    )}
                    onClick={() => router.push(`/messages?c=${c.id}`)}
                  >
                    <InitialsAvatar
                      initials={initialsFromName(c.title ?? "C")}
                      hue={hueFromId(c.id)}
                      size={40}
                      src={c.peerAvatar}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{c.title ?? "Conversation"}</span>
                        {c.unreadCount > 0 ? (
                          <span className="size-2 shrink-0 rounded-full bg-brand" aria-label={`${c.unreadCount} unread`} />
                        ) : null}
                      </span>
                      <span className="mt-0.5 block type-micro">{KIND_COPY[c.kind]?.label ?? c.kind}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{c.preview ?? "No messages yet"}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </aside>
          <section className="flex min-h-0 flex-col">
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <InitialsAvatar
                  initials={initialsFromName(active?.title ?? "C")}
                  hue={hueFromId(currentId ?? "x")}
                  size={36}
                  src={active?.peerAvatar}
                />
                <div>
                  <p className="text-sm font-semibold">{active?.title ?? "Conversation"}</p>
                  <p className="type-micro">{kind.label}</p>
                </div>
              </div>
              {active?.peerHref ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={active.peerHref}>Profile</a>
                </Button>
              ) : null}
            </header>
            <p className="border-b border-border bg-surface-muted px-4 py-2 text-xs text-muted-foreground">{kind.body}</p>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">No messages in this thread yet. Write the first note below.</p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "max-w-[72%] px-3.5 py-2 text-sm leading-6",
                    m.senderId === selfId
                      ? "ml-auto bg-foreground text-white"
                      : "border border-border bg-white text-foreground",
                  )}
                >
                  <p>{m.body}</p>
                  <p className={cn("mt-1 text-[11px]", m.senderId === selfId ? "text-white/65" : "text-muted-foreground")}>
                    {formatDistanceToNow(new Date(m.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
            {currentId && (
              <form
                className="flex gap-2 border-t border-border p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  start(async () => {
                    const result = await sendMessage(currentId, text);
                    if (!result.ok) setError(result.error);
                    else {
                      setText("");
                      setError(null);
                      router.refresh();
                    }
                  });
                }}
              >
                <label className="sr-only" htmlFor="message-body">
                  Message
                </label>
                <Input
                  id="message-body"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Write a message"
                  disabled={pending}
                />
                <Button type="submit" disabled={pending || !text.trim()}>
                  {pending ? "Sending…" : "Send"}
                </Button>
              </form>
            )}
            {error && (
              <p className="px-3 pb-2 text-sm text-rose-700" role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CardPicker({
  people,
  peopleQuery,
  pending,
  start,
  setError,
}: {
  people: PublicProfile[];
  peopleQuery: string;
  pending: boolean;
  start: ReturnType<typeof useTransition>[1];
  setError: (value: string | null) => void;
}) {
  const router = useRouter();
  return (
    <div className="border border-border bg-white p-4">
      <form className="flex flex-wrap gap-2" action="/messages" method="get">
        <label className="sr-only" htmlFor="people-search">
          Find a professional
        </label>
        <Input id="people-search" name="q" defaultValue={peopleQuery} placeholder="Search people to message" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {people.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {people.map((person) => (
            <li key={person.id} className="flex items-center justify-between gap-3">
              <span className="text-sm">{person.fullName}</span>
              <Button
                type="button"
                size="sm"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const result = await startOrGetPersonConversation(person.id);
                    if (!result.ok) setError(result.error);
                    else if (result.id) router.push(`/messages?c=${result.id}`);
                  })
                }
              >
                Message
              </Button>
            </li>
          ))}
        </ul>
      ) : peopleQuery ? (
        <p className="mt-2 text-sm text-muted-foreground">No public profiles match that search.</p>
      ) : null}
    </div>
  );
}
