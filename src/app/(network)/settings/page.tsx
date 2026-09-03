import Link from "next/link";
import { Card } from "@/components/ui/card";
import { getAuthContext } from "@/lib/data/query";

export default async function SettingsPage() {
  const session = await getAuthContext();
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
        <p className="font-medium">Never public</p>
        <p className="mt-1 text-muted-foreground">
          Aadhaar, bank, salary, PF, ESI, home address, medical details, emergency nominee, raw attendance and payouts.
          This product does not store those fields on profiles.
        </p>
      </Card>
    </div>
  );
}
