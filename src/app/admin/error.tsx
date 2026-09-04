"use client";

import { ErrorState } from "@/components/states/empty-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} />;
}
