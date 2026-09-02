"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { supabaseConfigured } from "@/lib/supabase/env";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/feed";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!supabaseConfigured()) {
    return (
      <Card className="mx-auto mt-16 max-w-md p-6">
        <Wordmark />
        <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authentication needs Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then apply the
          Identity migration.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-16 max-w-md p-6">
      <Wordmark />
      <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">We email a magic link. A profile row is created on first sign-in.</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setStatus(null);
          const supabase = createBrowserSupabase();
          if (!supabase) {
            setError("Supabase is not configured.");
            return;
          }
          const origin = window.location.origin;
          const { error: signError } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
          if (signError) setError(signError.message);
          else setStatus("Check your email for the sign-in link.");
        }}
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email"
        />
        <Button type="submit" className="w-full">
          Send magic link
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-rose-700">{error}</p>}
      {status && <p className="mt-3 text-sm text-emerald-700">{status}</p>}
      <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
        Back
      </Button>
    </Card>
  );
}
