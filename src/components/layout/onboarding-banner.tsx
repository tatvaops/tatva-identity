import Link from "next/link";
import { getAuthContext } from "@/lib/data/query";
import { profileNeedsIdentitySetup, profileNeedsPublicHandle } from "@/lib/domain/onboarding";

export async function OnboardingBanner() {
  const session = await getAuthContext();
  if (!session.profile) return null;
  if (profileNeedsIdentitySetup(session.profile)) {
    return (
      <div className="mb-4 rounded-xl border border-[#d9def8] bg-[#eef0ff] px-4 py-3 text-sm text-[#2437d4]">
        Finish your professional identity so people can find you.{" "}
        <Link href="/onboarding" className="font-semibold underline">
          Continue setup
        </Link>
      </div>
    );
  }
  if (profileNeedsPublicHandle(session.profile)) {
    return (
      <div className="mb-4 rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
        Your public URL still uses a generated handle.{" "}
        <Link href="/onboarding" className="font-semibold text-primary underline">
          Choose a handle
        </Link>
      </div>
    );
  }
  return null;
}
