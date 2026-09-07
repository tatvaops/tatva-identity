import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";
import { LanguageForm } from "@/features/settings/language-form";
import { SettingsWorkspace } from "@/features/settings/settings-workspace";
import { listBlockedPeople, listStaffOrganisations, loadNotificationPrefs } from "@/lib/data/workspace";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";

export default async function SettingsPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/settings");
  if (!session.profile) redirect("/onboarding");
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const [blocked, orgs, prefs] = await Promise.all([
    listBlockedPeople(session.userId),
    listStaffOrganisations(session.userId),
    loadNotificationPrefs(session.userId),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <SettingsWorkspace
        profile={session.profile}
        notificationPrefs={prefs}
        blocked={blocked.data}
        organisations={orgs.data}
      />
      <Card id="preferences" className="mx-auto max-w-xl scroll-mt-24 p-5 text-sm">
        <p className="font-medium">Language</p>
        <p className="mt-1 text-muted-foreground">
          Shell labels can follow English or Hindi. Other locales are reserved until copy is complete.
        </p>
        <LanguageForm current={locale} />
      </Card>
      <Card className="mx-auto max-w-xl p-5 text-sm">
        <p className="font-medium">Never public</p>
        <p className="mt-1 text-muted-foreground">
          Aadhaar, bank, salary, PF, ESI, home address, medical details, emergency nominee, raw attendance and payouts.
          This product does not store those fields on profiles.
        </p>
      </Card>
      {session.isPlatformAdmin ? (
        <Card className="mx-auto max-w-xl p-5 text-sm">
          <p className="font-medium">Platform operations</p>
          <Link className="mt-2 inline-block text-primary hover:underline" href="/admin">
            Open operations console
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
