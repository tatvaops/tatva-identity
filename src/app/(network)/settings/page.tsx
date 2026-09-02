import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card className="p-5 text-sm">
        <p className="font-medium">Public profile</p>
        <p className="mt-1 text-muted-foreground">
          Name, photo, headline, professional location, skills, public projects and opted-in credentials.
        </p>
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
