import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/features/onboarding/onboarding-wizard";
import { ProfileBootstrapRecovery } from "@/features/onboarding/profile-bootstrap";
import { getAuthContext } from "@/lib/data/query";
import { getOnboardingStep } from "@/lib/data/workspace";
import { clampOnboardingStep } from "@/lib/domain/onboarding";

export default async function OnboardingPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/onboarding");
  if (!session.profile) return <ProfileBootstrapRecovery />;
  const savedStep = clampOnboardingStep(await getOnboardingStep(session.profile.id));
  return <OnboardingWizard profile={session.profile} initialStep={savedStep} />;
}
