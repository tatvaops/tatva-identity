"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/states/empty-state";

export default function RootError({ error, reset }: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  useEffect(() => {
    console.error("IDENTITI root route error", error);
  }, [error]);

  return (
    <main className="page-wrap px-4 py-12 sm:px-6">
      <ErrorState onRetry={reset} />
    </main>
  );
}
