"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { uploadPublicImage } from "@/lib/actions/media";
import {
  addFieldNoteAction,
  addSiteJournalEntryAction,
  createSiteJournalAction,
  deleteFieldNoteAction,
  submitSiteJournalAction,
} from "@/lib/actions/site-journals";
import { ENTRY_TYPES, type FieldNoteView } from "@/lib/domain/site-journal";
import { siteJournalPath } from "@/lib/domain/site-journal-routes";

function formValue(form: FormData, name: string, fallback = "") {
  const value = form.get(name);
  return typeof value === "string" ? value : fallback;
}

function FormError({ error }: Readonly<{ error: string | null }>) {
  if (!error) return null;
  return (
    <p className="text-sm text-rose-700" role="alert">
      {error}
    </p>
  );
}

export function SiteJournalCreateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState("");
  const [pending, start] = useTransition();
  return (
    <Card className="p-5">
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await createSiteJournalAction({
              title: formValue(form, "title"),
              description: formValue(form, "description"),
              cover_media: cover || formValue(form, "cover_media"),
              project_type: formValue(form, "project_type"),
              city: formValue(form, "city"),
              region: formValue(form, "region"),
              budget_range: formValue(form, "budget_range"),
              timeline_start_date: formValue(form, "timeline_start_date"),
              tags: formValue(form, "tags")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              visibility: formValue(form, "visibility", "public"),
            });
            if (!result.ok) setError(result.error);
            else router.push(siteJournalPath(result.id ?? ""));
          });
        }}
      >
        <Input name="title" required placeholder="Journal title" aria-label="Title" className="md:col-span-2" />
        <Input name="project_type" placeholder="Project type, e.g. Residential Construction" aria-label="Project type" />
        <Input name="budget_range" placeholder="Budget range" aria-label="Budget range" />
        <Input name="city" placeholder="City" aria-label="City" />
        <Input name="region" placeholder="Region / state" aria-label="Region" />
        <Input name="timeline_start_date" type="date" required aria-label="Start date" />
        <select name="visibility" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Visibility">
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
        <Input name="tags" placeholder="Tags, comma separated" aria-label="Tags" className="md:col-span-2" />
        <div className="md:col-span-2 space-y-2">
          <Input
            name="cover_media"
            value={cover}
            onChange={(event) => setCover(event.target.value)}
            placeholder="https://… cover photo or upload from this device"
            aria-label="Cover"
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-zinc-100 file:px-2 file:py-1"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              start(async () => {
                const data = new FormData();
                data.set("file", file);
                data.set("kind", "journal");
                const uploaded = await uploadPublicImage(data);
                if (!uploaded.ok) setError(uploaded.error);
                else setCover(uploaded.id ?? "");
              });
            }}
          />
        </div>
        <Textarea name="description" placeholder="What this diary will track" className="min-h-28 md:col-span-2" aria-label="Description" />
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create draft journal"}
          </Button>
        </div>
        <div className="md:col-span-2">
          <FormError error={error} />
        </div>
      </form>
    </Card>
  );
}

export function SiteJournalEntryComposer({ slug }: Readonly<{ slug: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold">Add a weekly entry</p>
      <form
        className="mt-3 grid gap-3 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            const result = await addSiteJournalEntryAction(slug, {
              week_number: formValue(form, "week_number"),
              entry_type: formValue(form, "entry_type"),
              title: formValue(form, "title"),
              content: formValue(form, "content"),
              risk_level: formValue(form, "risk_level", "low"),
              tags: formValue(form, "tags")
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
              location_context: {
                city: formValue(form, "location_city"),
                region: formValue(form, "location_region"),
              },
            });
            if (!result.ok) setError(result.error);
            else {
              setError(null);
              event.currentTarget.reset();
              router.refresh();
            }
          });
        }}
      >
        <Input name="week_number" type="number" min={1} max={500} required placeholder="Week number" aria-label="Week number" />
        <select name="entry_type" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Entry type" defaultValue="Execution Update">
          {ENTRY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Input name="title" required placeholder="What changed this week" aria-label="Entry title" className="md:col-span-2" />
        <select name="risk_level" className="h-10 rounded-lg border border-input px-2 text-sm" aria-label="Risk">
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>
        <Input name="tags" placeholder="Tags, comma separated" aria-label="Entry tags" />
        <Input name="location_city" placeholder="Site city" aria-label="Site city" />
        <Input name="location_region" placeholder="Site region" aria-label="Site region" />
        <Textarea name="content" required placeholder="Procurement, labour, milestone or risk detail" className="min-h-28 md:col-span-2" aria-label="Entry body" />
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Publish week"}
          </Button>
        </div>
        <FormError error={error} />
      </form>
    </Card>
  );
}

export function SubmitJournalButton({ slug }: Readonly<{ slug: string }>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const result = await submitSiteJournalAction(slug);
            if (!result.ok) setError(result.error);
            else router.refresh();
          })
        }
      >
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
      <FormError error={error} />
    </div>
  );
}

export function EntryFieldNotes({
  slug,
  entryId,
  notes,
  signedIn,
  viewerId,
}: Readonly<{
  slug: string;
  entryId: string;
  notes: FieldNoteView[];
  signedIn: boolean;
  viewerId?: string | null;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Field notes</p>
      {notes.length === 0 ? <p className="text-sm text-muted-foreground">No field notes yet.</p> : null}
      {notes.map((note) => (
        <div key={note.id} className="border border-border p-3 text-sm">
          <p className="font-medium">{note.author_name}</p>
          <p className="mt-1 text-text-secondary">{note.content}</p>
          {viewerId === note.identity_key && !note.deleted ? (
            <button
              type="button"
              className="mt-2 text-xs text-rose-700 underline"
              onClick={() =>
                start(async () => {
                  const result = await deleteFieldNoteAction(slug, entryId, note.id);
                  if (!result.ok) setError(result.error);
                  else router.refresh();
                })
              }
            >
              Remove
            </button>
          ) : null}
          {note.replies.map((reply) => (
            <div key={reply.id} className="mt-2 border-l border-border pl-3">
              <p className="font-medium">{reply.author_name}</p>
              <p className="mt-1 text-text-secondary">{reply.content}</p>
            </div>
          ))}
        </div>
      ))}
      {signedIn ? (
        <form
          className="grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              const result = await addFieldNoteAction(slug, entryId, {
                content: formValue(form, "content"),
              });
              if (!result.ok) setError(result.error);
              else {
                setError(null);
                event.currentTarget.reset();
                router.refresh();
              }
            });
          }}
        >
          <Textarea name="content" required placeholder="Add a field note" className="min-h-16" aria-label="Field note" />
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Posting…" : "Post note"}
          </Button>
        </form>
      ) : null}
      <FormError error={error} />
    </div>
  );
}
