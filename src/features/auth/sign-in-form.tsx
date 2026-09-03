"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-path";
import { parseSignInSecret } from "@/lib/auth/sign-in-input";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { supabaseConfigured, supabaseUrl } from "@/lib/supabase/env";
import type { SupabaseClient } from "@supabase/supabase-js";

function timeout(ms: number) {
  return new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error("timeout")), ms);
  });
}

async function finishOnApp(router: ReturnType<typeof useRouter>, next: string) {
  router.replace(next);
  router.refresh();
}

async function completeWithSecret(opts: {
  supabase: SupabaseClient;
  projectUrl: string;
  email: string;
  secret: string;
  next: string;
  router: ReturnType<typeof useRouter>;
}) {
  const parsed = parseSignInSecret(opts.secret, {
    appOrigin: window.location.origin,
    supabaseUrl: opts.projectUrl,
  });

  if (parsed.kind === "verifyUrl" || parsed.kind === "callback") {
    window.location.assign(parsed.href);
    return "navigating";
  }

  if (parsed.kind === "tokenHash") {
    const { error } = await Promise.race([
      opts.supabase.auth.verifyOtp({ type: parsed.type, token_hash: parsed.tokenHash }),
      timeout(15000),
    ]);
    if (error) return "That sign-in link is invalid or expired. Wait about an hour and send a new email.";
    await finishOnApp(opts.router, opts.next);
    return null;
  }

  if (parsed.kind !== "otp") {
    return "Paste the sign-in link from the email. Do not paste a google.com address from the browser bar.";
  }

  const { error } = await Promise.race([
    opts.supabase.auth.verifyOtp({ email: opts.email, token: parsed.token, type: "email" }),
    timeout(15000),
  ]);
  if (error) return "That code is wrong or expired. Wait about an hour and send a new email.";
  await finishOnApp(opts.router, opts.next);
  return null;
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link"
      ? "That sign-in link did not work. Copy the link from the email and paste it here — do not click it."
      : null,
  );

  if (!supabaseConfigured()) {
    return (
      <Card className="mx-auto mt-16 max-w-md p-6">
        <Wordmark />
        <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Authentication needs Supabase. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </Card>
    );
  }

  let submitLabel = "Sign in";
  if (pending) submitLabel = "Working…";
  else if (step === "email") submitLabel = "Send email";

  let helpText = `Check inbox and spam for ${email}. Copy the sign-in link from that email and paste it below. Do not click the link.`;
  if (step === "email") {
    helpText = "Enter your email. We send a sign-in link. First use creates your profile.";
  }

  return (
    <Card className="mx-auto mt-16 max-w-md p-6">
      <Wordmark />
      <h1 className="mt-4 text-xl font-semibold">Sign in</h1>
      <p className="mt-1 text-sm text-muted-foreground">{helpText}</p>
      <form
        className="mt-4 space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setError(null);
          const supabase = createBrowserSupabase();
          const projectUrl = supabaseUrl();
          if (!supabase || !projectUrl) {
            setError("Supabase is not configured.");
            setPending(false);
            return;
          }
          try {
            if (step === "email") {
              document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax`;
              const { error: sendError } = await Promise.race([
                supabase.auth.signInWithOtp({
                  email,
                  options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                }),
                timeout(15000),
              ]);
              if (sendError) {
                const limited = sendError.message.toLowerCase().includes("rate limit");
                setError(
                  limited
                    ? "No new email was sent. Wait about an hour. If you already have a sign-in email, paste that link below."
                    : "Could not send the email. Try again in a few minutes.",
                );
                if (limited) setStep("code");
                return;
              }
              setStep("code");
              return;
            }

            const result = await completeWithSecret({
              supabase,
              projectUrl,
              email,
              secret: code,
              next,
              router,
            });
            if (result && result !== "navigating") setError(result);
          } catch {
            setError("Sign-in timed out. Wait a moment and try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          aria-label="Email"
          disabled={pending || step === "code"}
        />
        {step === "code" ? (
          <Input
            autoComplete="one-time-code"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Paste the sign-in link from the email"
            aria-label="Sign-in link from email"
            disabled={pending}
          />
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {submitLabel}
        </Button>
      </form>
      {error ? (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
      {step === "code" ? (
        <button
          type="button"
          className="mt-3 text-sm text-primary hover:underline"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
          }}
        >
          Use a different email
        </button>
      ) : null}
      <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
        Back
      </Button>
    </Card>
  );
}
