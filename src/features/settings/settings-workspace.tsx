"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { updateNotificationPrefs, updatePrivacy, updateProfileHandle } from "@/lib/actions/profile";
import { toggleBlock } from "@/lib/actions/network";
import { signOut } from "@/lib/actions/network";
import type { PublicProfile, VisibilityAudience } from "@/lib/types/identity";

const AUDIENCES: { value: VisibilityAudience; label: string }[] = [
  { value: "public", label: "Anyone" },
  { value: "connections", label: "Connections" },
  { value: "recruiters", label: "Recruiters and connections" },
  { value: "private", label: "Only me" },
];

function Select({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <select name={name} defaultValue={defaultValue} className="mt-1 h-10 w-full rounded-lg border border-input bg-white px-3 text-sm">
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function SettingsWorkspace({
  profile,
  notificationPrefs,
  blocked,
  organisations,
}: {
  profile: PublicProfile;
  notificationPrefs: {
    notifyConnections: boolean;
    notifyMessages: boolean;
    notifyApplications: boolean;
    notifySocial: boolean;
    notifyOrganisation: boolean;
  };
  blocked: PublicProfile[];
  organisations: { id: string; slug: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <section id="account" className="scroll-mt-24">
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Account</h2>
          <p className="text-sm text-muted-foreground">
            You sign in with WhatsApp OTP. IDENTITI does not use email/password on this product.
          </p>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await signOut();
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                router.push("/");
                router.refresh();
              })
            }
          >
            Sign out
          </Button>
        </Card>
      </section>

      <section id="profile" className="scroll-mt-24">
        <Card className="space-y-3 p-5">
          <h2 className="font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Public handle and passport workspace.</p>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const handle = String(new FormData(event.currentTarget).get("handle") ?? "");
              start(async () => {
                const result = await updateProfileHandle(handle);
                if (!result.ok) setError(result.error);
                else router.refresh();
              });
            }}
          >
            <label className="block text-sm">
              <span className="font-medium">Handle</span>
              <Input name="handle" defaultValue={profile.handle} className="mt-1" />
            </label>
            <Button type="submit" disabled={pending}>
              Save handle
            </Button>
          </form>
          <Link className="inline-block text-sm text-primary hover:underline" href="/passport">
            Open passport workspace
          </Link>
        </Card>
      </section>

      <section id="privacy" className="scroll-mt-24">
        <Card className="p-5">
          <h2 className="font-semibold">Privacy</h2>
          <p className="mt-1 text-sm text-muted-foreground">These controls are enforced when someone views your public passport.</p>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              start(async () => {
                const result = await updatePrivacy({
                  aboutVisibleTo: String(form.get("aboutVisibleTo")),
                  locationVisibleTo: String(form.get("locationVisibleTo")),
                  emailVisibleTo: String(form.get("emailVisibleTo")),
                  availabilityVisibleTo: String(form.get("availabilityVisibleTo")),
                  connectionsVisibleTo: String(form.get("connectionsVisibleTo")),
                  activityVisibleTo: String(form.get("activityVisibleTo")),
                  projectsVisibleTo: String(form.get("projectsVisibleTo")),
                  experienceVisibleTo: String(form.get("experienceVisibleTo")),
                });
                if (!result.ok) setError(result.error);
                else router.refresh();
              });
            }}
          >
            {(
              [
                ["aboutVisibleTo", "About", profile.aboutVisibleTo],
                ["locationVisibleTo", "Location", profile.locationVisibleTo],
                ["availabilityVisibleTo", "Availability", profile.availabilityVisibleTo],
                ["experienceVisibleTo", "Experience", profile.experienceVisibleTo],
                ["projectsVisibleTo", "Projects", profile.projectsVisibleTo],
                ["activityVisibleTo", "Activity", profile.activityVisibleTo],
                ["connectionsVisibleTo", "Connections", profile.connectionsVisibleTo],
              ] as const
            ).map(([name, label, value]) => (
              <label key={name} className="block text-sm">
                <span className="font-medium">{label}</span>
                <Select name={name} defaultValue={value} options={AUDIENCES} />
              </label>
            ))}
            <label className="block text-sm">
              <span className="font-medium">Contact preference</span>
              <Select
                name="emailVisibleTo"
                defaultValue={profile.emailVisibleTo}
                options={[
                  { value: "none", label: "Never show a personal inbox" },
                  { value: "connections", label: "Connections" },
                  { value: "recruiters", label: "Recruiters" },
                ]}
              />
            </label>
            <Button type="submit" disabled={pending}>
              Save privacy
            </Button>
          </form>
        </Card>
      </section>

      <section id="notifications" className="scroll-mt-24">
        <Card className="p-5">
          <h2 className="font-semibold">Notifications</h2>
          <form
            className="mt-3 space-y-2 text-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              start(async () => {
                const result = await updateNotificationPrefs({
                  notifyConnections: form.get("notifyConnections") === "on",
                  notifyMessages: form.get("notifyMessages") === "on",
                  notifyApplications: form.get("notifyApplications") === "on",
                  notifySocial: form.get("notifySocial") === "on",
                  notifyOrganisation: form.get("notifyOrganisation") === "on",
                });
                if (!result.ok) setError(result.error);
                else router.refresh();
              });
            }}
          >
            {[
              ["notifyConnections", "Connections", notificationPrefs.notifyConnections],
              ["notifyMessages", "Messages", notificationPrefs.notifyMessages],
              ["notifyApplications", "Applications", notificationPrefs.notifyApplications],
              ["notifySocial", "Comments and reactions", notificationPrefs.notifySocial],
              ["notifyOrganisation", "Organisation activity", notificationPrefs.notifyOrganisation],
            ].map(([name, label, checked]) => (
              <label key={String(name)} className="flex items-center gap-2">
                <input type="checkbox" name={String(name)} defaultChecked={Boolean(checked)} />
                {label}
              </label>
            ))}
            <Button type="submit" disabled={pending}>
              Save notifications
            </Button>
          </form>
        </Card>
      </section>

      <section id="security" className="scroll-mt-24">
        <Card className="space-y-2 p-5 text-sm">
          <h2 className="font-semibold">Security</h2>
          <p className="text-muted-foreground">
            Session is a Supabase cookie after WhatsApp OTP. There is no email/password on this product. Sign out from
            Account if this device should no longer stay signed in. Blocked people cannot message you. Reports go to operators.
          </p>
          {blocked.length === 0 ? (
            <p className="text-muted-foreground">No blocked accounts.</p>
          ) : (
            <ul className="space-y-2">
              {blocked.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-2">
                  <span>{person.fullName}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      start(async () => {
                        await toggleBlock(person.id, true);
                        router.refresh();
                      })
                    }
                  >
                    Unblock
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section id="organisation" className="scroll-mt-24">
        <Card className="space-y-2 p-5 text-sm">
          <h2 className="font-semibold">Organisation</h2>
          {organisations.length === 0 ? (
            <p className="text-muted-foreground">
              You have not created an organisation.{" "}
              <Link className="text-primary hover:underline" href="/companies/new">
                Create one
              </Link>
            </p>
          ) : (
            <ul className="space-y-1">
              {organisations.map((org) => (
                <li key={org.id}>
                  <Link className="text-primary hover:underline" href={`/companies/${org.slug}/edit`}>
                    {org.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {error ? (
        <p className="text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
