import Link from "next/link";
import { cookies } from "next/headers";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";
import { LanguageForm } from "@/features/settings/language-form";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n";

export default async function SettingsPage() {
  const session = await getAuthContext();
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card className="p-5 text-sm">
        <p className="font-medium">Public profile</p>
        <p className="mt-1 text-muted-foreground">
          Name, photo, headline, professional location, skills, public projects and opted-in credentials.
        </p>
        {session.profile && (
          <Link className="mt-2 inline-block text-primary hover:underline" href={`/people/${session.profile.handle}`}>
            View profile
          </Link>
        )}
      </Card>
      <Card className="p-5 text-sm">
        <p className="font-medium">Public QR passport</p>
        <p className="mt-1 text-muted-foreground">
          A limited passport others can scan. It never includes documents, rates or private files.
        </p>
        {session.profile && (
          <Link className="mt-2 inline-block text-primary hover:underline" href={`/passport/${session.profile.handle}`}>
            Open public passport
          </Link>
        )}
      </Card>
      <Card className="p-5 text-sm">
        <p className="font-medium">Language</p>
        <p className="mt-1 text-muted-foreground">
          Shell labels can follow English or Hindi. Other locales are reserved until copy is complete.
        </p>
        <LanguageForm current={locale} />
      </Card>
      <Card className="p-5 text-sm">
        <p className="font-medium">Never public</p>
        <p className="mt-1 text-muted-foreground">
          Aadhaar, bank, salary, PF, ESI, home address, medical details, emergency nominee, raw attendance and payouts.
          This product does not store those fields on profiles.
        </p>
      </Card>
      {session.isPlatformAdmin ? (
        <Card className="p-5 text-sm">
          <p className="font-medium">Platform operations</p>
          <p className="mt-1 text-muted-foreground">
            Verification review, hide from discovery, moderation and operator roster. Not a public directory.
          </p>
          <Link className="mt-2 inline-block text-primary hover:underline" href="/admin">
            Open operations console
          </Link>
        </Card>
      ) : null}
    </div>
  );
}
