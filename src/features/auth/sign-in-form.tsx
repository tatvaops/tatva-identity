"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AUTH_NEXT_COOKIE, safeNextPath } from "@/lib/auth/next-path";
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
  if (lower.includes("otp") || lower.includes("token") || lower.includes("expired")) {
    return "That code or link is invalid or has expired. Request a new one.";
  }
  return "Could not complete sign-in. Try again in a moment.";
}

function unwrapEmailLink(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const nested = url.searchParams.get("q");
    if (nested && url.hostname.includes("google.com")) {
      return nested;
    }
    if (url.pathname.includes("/auth/v1/verify") || url.pathname.includes("/auth/callback")) {
      return trimmed;
    }
    return nested;
  } catch {
    return null;
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timeout")), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const linkFailed = params.get("error") === "link";
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pastedLink, setPastedLink] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(
    linkFailed
      ? { kind: "error", text: "That sign-in link could not be completed. Request a new one, or enter the email code." }
      : null,
  );
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

          if (sent) {
            const unwrapped = unwrapEmailLink(pastedLink);
            if (unwrapped) {
              window.location.assign(unwrapped);
              return;
            }
            if (!code.trim()) {
              setNotice({
                kind: "error",
                text: "Paste the sign-in link from the email, or enter the code if the email includes one.",
              });
              setPending(false);
              return;
            }
            try {
              const { error: verifyError } = await withTimeout(
                supabase.auth.verifyOtp({ email, token: code.trim(), type: "email" }),
                15000,
              );
              if (current !== requestId.current) return;
              if (verifyError) {
                setNotice({ kind: "error", text: otpErrorMessage(verifyError.message) });
                setPending(false);
                return;
              }
              router.replace(next);
              router.refresh();
            } catch {
              if (current !== requestId.current) return;
              setNotice({ kind: "error", text: "Sign-in is taking too long. Try the code again." });
              setPending(false);
            }
            return;
          }

          document.cookie = `${AUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; Path=/; Max-Age=600; SameSite=Lax`;
          try {
            const { error: signError } = await withTimeout(
              supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
              }),
              15000,
            );
            if (current !== requestId.current) return;
            setPending(false);
            if (signError) {
              setNotice({ kind: "error", text: otpErrorMessage(signError.message) });
              return;
            }
            setSent(true);
            setNotice({
              kind: "ok",
              text: "Check your email. If Gmail opens a Google page that never finishes, copy the link from the email and paste it below — do not click it.",
            });
          } catch {
            if (current !== requestId.current) return;
            setPending(false);
            setNotice({ kind: "error", text: "Sending the email took too long. Wait a minute and try once." });
          }
        }}
      >
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email"
          disabled={pending || sent}
        />
        {sent ? (
          <>
            <Input
              value={pastedLink}
              onChange={(e) => setPastedLink(e.target.value)}
              placeholder="Paste the sign-in link here"
              aria-label="Sign-in link from email"
              disabled={pending}
            />
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Or 6-digit code, if the email has one"
              aria-label="Email code"
              disabled={pending}
            />
          </>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Working…" : sent ? "Continue sign-in" : "Send magic link"}
        </Button>
      </form>
      {notice ? (
        <p
          className={`mt-3 text-sm ${notice.kind === "error" ? "text-rose-700" : "text-emerald-700"}`}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      ) : null}
      {sent ? (
        <button
          type="button"
          className="mt-3 text-sm text-primary hover:underline"
          onClick={() => {
            setSent(false);
            setCode("");
            setPastedLink("");
            setNotice(null);
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
