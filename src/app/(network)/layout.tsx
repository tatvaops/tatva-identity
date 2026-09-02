import type { ReactNode } from "react";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/layout/app-shell";
import { getAuthContext } from "@/lib/data/query";

export default async function NetworkLayout({ children }: { children: ReactNode }) {
  const session = await getAuthContext();
  return (
    <SessionProvider value={session}>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
