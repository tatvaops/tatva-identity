"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { completeOnboarding } from "@/lib/actions/profile";
import { defaultHandleFromName, normalizeHandle } from "@/lib/domain/onboarding";
import { safeNextPath } from "@/lib/auth/next-path";
import { personPublicHref } from "@/lib/domain/identiti-routes";
import type { OccupationMode, PublicProfile } from "@/lib/types/identity";

const OCCUPATIONS: { id: OccupationMode; label: string; help: string }[] = [
  { id: "white_collar", label: "Professional", help: "Design, engineering, architecture, project leadership." },
  { id: "freelancer", label: "Independent professional", help: "You take briefs as yourself, not a company." },
  { id: "blue_collar", label: "Skilled / gig worker", help: "Site, trade and installation work." },
  { id: "contractor", label: "Contractor", help: "You take packages and crew work." },
];

export function OnboardingForm({
  profile,
  nextPath,
}: {
  profile: PublicProfile;
  nextPath?: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const suggested = defaultHandleFromName(profile.fullName === "New professional" ? "" : profile.fullName);
  const [fullName, setFullName] = useState(profile.fullName === "New professional" ? "" : profile.fullName);
  const [handle, setHandle] = useState(profile.handle.startsWith("u-") ? suggested : profile.handle);
  const [occupationMode, setOccupationMode] = useState<OccupationMode>(profile.occupationMode);
  const [headline, setHeadline] = useState(profile.headline ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [about, setAbout] = useState(profile.about ?? "");

  return (
    <Card className="mx-auto max-w-xl p-6">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#616ee7]">Professional passport</p>
      <h1 className="mt-2 text-2xl font-black tracking-tight text-[#111a42]">Establish who you are</h1>
      <p className="mt-2 text-sm text-[#747a95]">
        Name and category are enough to start. Skills, projects and evidence can be added later from your passport.
      </p>
      <form
        className="mt-6 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          start(async () => {
            const result = await completeOnboarding({
              fullName,
              handle: normalizeHandle(handle),
              occupationMode,
              headline,
              city,
              about,
            });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            const destination = safeNextPath(nextPath);
            const publicHref = personPublicHref(normalizeHandle(handle) || profile.handle, occupationMode);
            router.replace(destination === "/feed" ? publicHref : destination);
            router.refresh();
          });
        }}
      >
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Name</span>
          <Input value={fullName} onChange={(event) => setFullName(event.target.value)} required minLength={2} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Public handle</span>
          <Input
            value={handle}
            onChange={(event) => setHandle(normalizeHandle(event.target.value))}
            placeholder="your-name"
          />
          <span className="text-xs text-muted-foreground">Used in your public URL. You can change this later in Settings.</span>
        </label>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">How you work</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {OCCUPATIONS.map((item) => (
              <label
                key={item.id}
                className={`cursor-pointer rounded-xl border p-3 text-sm ${
                  occupationMode === item.id ? "border-[#2437d4] bg-[#eef0ff]" : "border-border"
                }`}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name="occupation"
                  checked={occupationMode === item.id}
                  onChange={() => setOccupationMode(item.id)}
                />
                <span className="font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{item.help}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Headline (optional)</span>
          <Input value={headline} onChange={(event) => setHeadline(event.target.value)} placeholder="Interior architect · Bengaluru" />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">City (optional)</span>
          <Input value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">About (optional)</span>
          <Textarea value={about} onChange={(event) => setAbout(event.target.value)} rows={4} />
        </label>
        {error ? (
          <p className="text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Continue"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending || fullName.trim().length < 2}
            onClick={() =>
              start(async () => {
                const result = await completeOnboarding({
                  fullName,
                  occupationMode,
                  skipHandle: true,
                });
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.replace(safeNextPath(nextPath));
                router.refresh();
              })
            }
          >
            Skip handle for now
          </Button>
        </div>
      </form>
    </Card>
  );
}
