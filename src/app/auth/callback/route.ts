import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-path";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next") ?? request.cookies.get(AUTH_NEXT_COOKIE)?.value);

  const failed = requestUrl.clone();
  failed.pathname = "/auth/sign-in";
  failed.search = "?error=link";

  const url = supabaseUrl();
  const key = supabaseAnonKey();
  if (!url || !key || (!code && !(tokenHash && type))) {
    return NextResponse.redirect(failed);
  }

  const destination = requestUrl.clone();
  destination.pathname = next;
  destination.search = "";
  const redirect = NextResponse.redirect(destination);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirect.cookies.set(name, value, options);
        });
      },
    },
  });

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type!, token_hash: tokenHash! });

  if (result.error) {
    const fail = NextResponse.redirect(failed);
    fail.cookies.delete(AUTH_NEXT_COOKIE);
    return fail;
  }

  redirect.cookies.set(AUTH_NEXT_COOKIE, "", { path: "/", maxAge: 0 });
  return redirect;
}
