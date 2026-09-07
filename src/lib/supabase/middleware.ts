import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  const url = supabaseUrl();
  const key = supabaseAnonKey();
  let response = NextResponse.next({ request });

  if (!url || !key) return response;

  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/auth/")) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && pathname.startsWith("/auth/sign-in")) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/feed";
    destination.search = "";
    return NextResponse.redirect(destination);
  }

  if (pathname.startsWith("/auth/")) return response;

  const protectedPrefixes = [
    "/admin",
    "/messages",
    "/notifications",
    "/settings",
    "/insights",
    "/saved",
    "/jobs/create",
    "/gigs/create",
    "/companies/new",
    "/graph",
    "/onboarding",
    "/applications",
    "/profile",
    "/passport/documents",
  ];
  const needsAuth =
    protectedPrefixes.some((p) => pathname.startsWith(p)) ||
    pathname === "/passport" ||
    pathname.endsWith("/applications") ||
    pathname.endsWith("/edit");
  if (needsAuth && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth/sign-in";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && !pathname.startsWith("/onboarding") && !pathname.startsWith("/api/")) {
    const { data, error } = await supabase.from("public_profiles").select("full_name").eq("id", user.id).maybeSingle();
    if (!error) {
      const unnamed = !data?.full_name?.trim() || data.full_name === "New professional";
      if (unnamed) {
        const setup = request.nextUrl.clone();
        setup.pathname = "/onboarding";
        setup.search = "";
        return NextResponse.redirect(setup);
      }
    }
  }

  return response;
}
