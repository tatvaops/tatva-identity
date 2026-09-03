"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { supabaseConfigured } from "@/lib/supabase/env";

function otpErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("after")) {
    return "Too many sign-in emails were requested. Wait a few minutes, then try once.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "Enter a valid email address.";
  }
  return "Could not send the sign-in link. Try again in a moment.";
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/feed";
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(null);
  const requestId = useRef(0);

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
      <h1 className="mt-4 text-xl font-semibold">Sign in or create your profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        There is no separate signup form. Enter your email and we send a magic link. First use creates your account and
        profile.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          const current = ++requestId.current;
          setPending(true);
          setNotice(null);
          const supabase = createBrowserSupabase();
          if (!supabase) {
            setNotice({ kind: "error", text: "Supabase is not configured." });
            setPending(false);
            return;
          }
          const origin = window.location.origin;
          const { error: signError } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
          });
          if (current !== requestId.current) return;
          setPending(false);
          if (signError) {
            setNotice({ kind: "error", text: otpErrorMessage(signError.message) });
            return;
          }
          setNotice({ kind: "ok", text: "Check your email for the sign-in link." });
        }}
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email"
          disabled={pending}
        />
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending…" : "Send magic link"}
        </Button>
      </form>
      {notice ? (
        <p className={`mt-3 text-sm ${notice.kind === "error" ? "text-rose-700" : "text-emerald-700"}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.text}
        </p>
      ) : null}
      <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
        Back
      </Button>
    </Card>
  );
}
