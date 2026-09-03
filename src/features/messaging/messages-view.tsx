"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { InitialsAvatar } from "@/components/identity/visuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/states/empty-state";
import { sendMessage } from "@/lib/actions/network";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { cn } from "@/lib/utils";
import type { ConversationSummary, MessageRow } from "@/lib/types/identity";

const KIND_COPY: Record<string, { label: string; body: string }> = {
  person: {
    label: "Person",
    body: "This thread is attached to a professional identity. Open their profile from search or notifications when linked.",
  },
  organisation: {
    label: "Organisation",
    body: "This thread is attached to a business identity. Company pages hold services, projects and verification.",
  },
  job: {
    label: "Job",
    body: "This conversation is about a longer-term role. Application state lives on the job page.",
  },
  gig: {
    label: "Gig",
    body: "This conversation is about immediate work. Shift details live on the gig page.",
  },
  project: {
    label: "Project",
    body: "This conversation is about a project entity. Contributors and companies are on the project page.",
  },
};

export function MessagesView({
  conversations,
  activeId,
  messages,
  selfId,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  messages: MessageRow[];
  selfId: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const active = conversations.find((c) => c.id === activeId) ?? conversations[0] ?? null;

  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        body="Open Message on a person or organisation to start a thread. Threads are not created automatically."
      />
    );
  }

  const currentId = active?.id ?? null;
  const kind = KIND_COPY[active?.kind ?? ""] ?? {
    label: active?.kind ? active.kind.replaceAll("_", " ") : "Conversation",
    body: "Context for this thread appears here when it is linked to a person, organisation, job, gig or project.",
  };

  return (
    <div className="grid h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-white lg:grid-cols-[280px_minmax(0,1fr)_260px]">
      <aside className="overflow-y-auto border-r border-border">
        <ul>
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className={cn("w-full px-4 py-3 text-left hover:bg-muted", c.id === currentId && "bg-accent")}
                onClick={() => router.push(`/messages?c=${c.id}`)}
              >
                <p className="text-sm font-medium">{c.title ?? "Conversation"}</p>
                <p className="truncate text-xs text-muted-foreground">{c.preview}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="flex min-h-0 flex-col">
        <header className="border-b border-border px-4 py-3 text-sm font-semibold">{active?.title ?? "Chat"}</header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages in this thread yet.</p>}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                m.senderId === selfId ? "ml-auto bg-primary text-white" : "bg-muted",
              )}
            >
              {m.body}
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
            />
            <Button type="submit" disabled={pending}>
              Send
            </Button>
          </form>
        )}
        {error && (
          <p className="px-3 pb-2 text-sm text-rose-700" role="alert">
            {error}
          </p>
        )}
      </section>
      <aside className="hidden border-l border-border p-4 lg:block">
        <InitialsAvatar initials={initialsFromName(active?.title ?? "C")} hue={hueFromId(currentId ?? "x")} size={56} />
        <p className="mt-2 text-sm font-semibold">{active?.title}</p>
        <p className="mt-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">{kind.label}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{kind.body}</p>
      </aside>
    </div>
  );
}
