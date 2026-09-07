import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { ProfileBootstrapRecovery } from "@/features/onboarding/profile-bootstrap";
import { getAuthContext } from "@/lib/data/query";
import { getOnboardingProgress } from "@/lib/data/workspace";
import { clampOnboardingStep, profileNeedsIdentitySetup } from "@/lib/domain/onboarding";
import { safeNextPath } from "@/lib/auth/next-path";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/onboarding");
  if (!session.profile) return <ProfileBootstrapRecovery />;
  const next = safeNextPath((await searchParams).next);
  const progress = await getOnboardingProgress(session.profile.id);
  if (progress.completed && !profileNeedsIdentitySetup(session.profile)) {
    redirect(next);
  }
  const savedStep = clampOnboardingStep(progress.step);
  return <OnboardingWizard profile={session.profile} initialStep={savedStep} nextPath={next} />;
}
