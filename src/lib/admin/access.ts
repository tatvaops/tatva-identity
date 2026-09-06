import { createAdminSupabase } from "@/lib/supabase/admin";
import { fail, requireUser, type ActionResult } from "@/lib/actions/shared";
import { isBootstrapAdmin, isPlatformAdminOpenToSignedIn } from "@/lib/admin/bootstrap";

export { bootstrapAdminHandles, bootstrapAdminUserIds, isBootstrapAdmin, isPlatformAdminOpenToSignedIn } from "@/lib/admin/bootstrap";

export async function ensurePlatformAdminRecord(userId: string, handle: string | null) {
  if (isPlatformAdminOpenToSignedIn()) return true;
  const admin = createAdminSupabase();
  if (!admin) return false;
  const existing = await admin.from("platform_admins").select("profile_id").eq("profile_id", userId).maybeSingle();
  if (existing.data?.profile_id) return true;
  if (!isBootstrapAdmin({ userId, handle })) return false;
  const inserted = await admin.from("platform_admins").insert({ profile_id: userId, granted_by: userId });
  return !inserted.error;
}

export async function requirePlatformAdmin() {
  const auth = await requireUser();
  if (auth.error || !auth.supabase || !auth.ctx.userId || !auth.ctx.profile) {
    return { ...auth, admin: null as ReturnType<typeof createAdminSupabase>, denied: true as const };
  }
  const admin = createAdminSupabase();
  if (!admin) {
    return { error: "Admin database access is not configured." as const, supabase: auth.supabase, ctx: auth.ctx, admin: null, denied: true as const };
  }
  const ok = await ensurePlatformAdminRecord(auth.ctx.userId, auth.ctx.profile.handle);
  if (!ok) {
    return { ...auth, admin: null, denied: true as const };
  }
  return { error: null, supabase: auth.supabase, ctx: auth.ctx, admin, denied: false as const };
}

export async function requirePlatformAdminResult(): Promise<
  | { ok: true; auth: Awaited<ReturnType<typeof requirePlatformAdmin>> & { denied: false; admin: NonNullable<ReturnType<typeof createAdminSupabase>> } }
  | { ok: false; result: ActionResult }
> {
  const auth = await requirePlatformAdmin();
  if (auth.error) return { ok: false, result: fail(auth.error) };
  if (auth.denied || !auth.admin || !auth.ctx.userId) {
    return { ok: false, result: fail("This console is only for platform operators.") };
  }
  return { ok: true, auth: auth as Awaited<ReturnType<typeof requirePlatformAdmin>> & { denied: false; admin: NonNullable<ReturnType<typeof createAdminSupabase>> } };
}
