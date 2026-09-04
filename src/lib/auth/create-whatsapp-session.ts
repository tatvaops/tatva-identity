import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { sessionUserMeta, type VerifiedPhone } from "@/lib/auth/whatsapp-identity";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import type { EmailOtpType } from "@supabase/supabase-js";

function alreadyExists(message: string) {
  return /already|registered|exists/i.test(message);
}

export async function createWhatsAppSession(request: NextRequest, verified: VerifiedPhone) {
  const admin = createAdminSupabase();
  const url = supabaseUrl();
  const anon = supabaseAnonKey();
  if (!admin || !url || !anon) {
    return NextResponse.json({ error: "Sign-in is not configured." }, { status: 500 });
  }

  const meta = sessionUserMeta(verified);
  const created = await admin.auth.admin.createUser({
    email: meta.email,
    email_confirm: true,
    phone: meta.phone,
    phone_confirm: true,
    user_metadata: {
      full_name: meta.fullName,
      phone: meta.phone,
      identity_key: meta.identityKey,
      auth_provider: meta.authProvider,
      avatar_url: meta.avatarUrl,
      tatva_email: meta.tatvaEmail,
    },
  });

  if (created.error && !alreadyExists(created.error.message)) {
    const emailOnly = await admin.auth.admin.createUser({
      email: meta.email,
      email_confirm: true,
      user_metadata: {
        full_name: meta.fullName,
        phone: meta.phone,
        identity_key: meta.identityKey,
        auth_provider: meta.authProvider,
      },
    });
    if (emailOnly.error && !alreadyExists(emailOnly.error.message)) {
      return NextResponse.json({ error: "Could not create your profile." }, { status: 500 });
    }
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: meta.email,
    options: { redirectTo: `${request.nextUrl.origin}/auth/callback` },
  });
  if (linkError || !link.properties.hashed_token) {
    return NextResponse.json({ error: "Could not start a session." }, { status: 500 });
  }

  if (link.user?.id && meta.fullName !== "New professional") {
    await admin.auth.admin.updateUserById(link.user.id, {
      user_metadata: {
        full_name: meta.fullName,
        phone: meta.phone,
        identity_key: meta.identityKey,
        auth_provider: meta.authProvider,
        avatar_url: meta.avatarUrl,
        tatva_email: meta.tatvaEmail,
      },
    });
  }

  const body = NextResponse.json({ ok: true, provider: verified.provider });
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          body.cookies.set(name, value, options);
        });
      },
    },
  });

  const type = (link.properties.verification_type || "magiclink") as EmailOtpType;
  const first = await supabase.auth.verifyOtp({ type, token_hash: link.properties.hashed_token });
  if (first.error) {
    const second = await supabase.auth.verifyOtp({ type: "email", token_hash: link.properties.hashed_token });
    if (second.error) {
      return NextResponse.json({ error: "Could not start a session." }, { status: 500 });
    }
  }

  return body;
}
