import type { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { DemoDataBanner } from "@/components/layout/demo-data-banner";
import { OnboardingBanner } from "@/components/layout/onboarding-banner";
import { getAuthContext } from "@/lib/data/query";

export default async function NetworkLayout({ children }: { children: ReactNode }) {
  const session = await getAuthContext();
  return (
    <SessionProvider value={session}>
      <AppShell>
        <DemoDataBanner />
        <OnboardingBanner />
        {children}
      </AppShell>
    </SessionProvider>
  );
}
