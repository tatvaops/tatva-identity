import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/providers/session-provider";
import { AdminDenied, AdminShell } from "@/features/admin/admin-shell";
import { requirePlatformAdmin } from "@/lib/admin/access";
import { isPlatformAdminOpenToSignedIn } from "@/lib/admin/bootstrap";

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
      <AdminShell profile={auth.ctx.profile}>
        {isPlatformAdminOpenToSignedIn() ? (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Operator access is temporarily open to every signed-in account. Turn this off in environment
            settings when you are ready to restrict the console to named operators.
          </p>
        ) : null}
        {children}
      </AdminShell>
    </SessionProvider>
  );
}
