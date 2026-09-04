import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/providers/session-provider";
import { AdminDenied, AdminShell } from "@/features/admin/admin-shell";
import { requirePlatformAdmin } from "@/lib/admin/access";

export const metadata: Metadata = {
  title: "Operations",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePlatformAdmin();
  if (!auth.ctx.userId || !auth.ctx.profile) {
    redirect("/auth/sign-in?next=/admin");
  }
  if (auth.denied) {
    return <AdminDenied message={auth.error} />;
  }
  return (
    <SessionProvider
      value={{
        userId: auth.ctx.userId,
        profile: auth.ctx.profile,
        configured: true,
        isPlatformAdmin: true,
      }}
    >
      <AdminShell profile={auth.ctx.profile}>{children}</AdminShell>
    </SessionProvider>
  );
}
