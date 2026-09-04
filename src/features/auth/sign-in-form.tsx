"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { safeNextPath } from "@/lib/auth/next-path";
import { digitsOnly, normalizeIndianMobile } from "@/lib/auth/phone";

function extractOtp(raw: string) {
  const match = /(\d{6})/.exec(raw.replace(/\s/g, ""));
  return match?.[1] ?? raw.replace(/\D/g, "").slice(0, 6);
}

export function SignInForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  let submitLabel = "Sign in";
  if (pending) submitLabel = "Working…";
  else if (step === "phone") submitLabel = "Send WhatsApp code";

  let helpText = `Enter the 6-digit code sent to +91 ${normalizeIndianMobile(phone) ?? phone} on WhatsApp.`;
  if (step === "phone") {
    helpText = "Enter your mobile number. We send a 6-digit code on WhatsApp. First use creates your profile.";
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
          try {
            const digits = normalizeIndianMobile(phone);
            if (!digits) {
              setError("Enter a 10-digit Indian mobile number.");
              return;
            }
            if (step === "phone") {
              const response = await fetch("/api/auth/whatsapp/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone: digits }),
              });
              const payload = (await response.json().catch(() => null)) as
                | { error?: string; dev_otp?: string }
                | null;
              if (!response.ok) {
                setError(payload?.error || "Could not send the WhatsApp code.");
                return;
              }
              setDevOtp(payload?.dev_otp ?? null);
              setStep("code");
              return;
            }

            const otp = extractOtp(code);
            if (!/^\d{6}$/.test(otp)) {
              setError("Enter the 6-digit code from WhatsApp.");
              return;
            }
            const response = await fetch("/api/auth/whatsapp/verify-otp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ phone: digits, code: otp }),
            });
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            if (!response.ok) {
              setError(payload?.error || "That code is wrong or expired.");
              return;
            }
            router.replace(next);
            router.refresh();
          } catch {
            setError("Sign-in timed out. Wait a moment and try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="grid h-10 place-items-center rounded-lg border border-input bg-muted px-3 text-sm text-muted-foreground">
            +91
          </span>
          <Input
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            required
            maxLength={10}
            value={phone}
            onChange={(event) => setPhone(digitsOnly(event.target.value).slice(0, 10))}
            placeholder="9876543210"
            aria-label="Mobile number"
            disabled={pending || step === "code"}
          />
        </div>
        {step === "code" ? (
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            maxLength={6}
            value={code}
            onChange={(event) => setCode(extractOtp(event.target.value))}
            placeholder="6-digit code"
            aria-label="WhatsApp code"
            disabled={pending}
          />
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {submitLabel}
        </Button>
      </form>
      {devOtp ? (
        <output className="mt-3 block text-sm text-slate-700">Dev code: {devOtp}</output>
      ) : null}
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
            setStep("phone");
            setCode("");
            setDevOtp(null);
            setError(null);
          }}
        >
          Use a different number
        </button>
      ) : null}
      <Button variant="ghost" className="mt-4" onClick={() => router.push("/")}>
        Back
      </Button>
    </Card>
  );
}
