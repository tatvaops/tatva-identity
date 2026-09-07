import { Suspense } from "react";
import { SignInForm } from "@/features/auth/sign-in-form";

export default function SignInPage() {
  return (
    <Suspense fallback={<p className="mx-auto mt-16 max-w-md text-sm text-muted-foreground">Loading sign-in…</p>}>
      <SignInForm />
    </Suspense>
  );
}
