"use client";

import { ErrorState } from "@/components/states/empty-state";

export default function Error({ error }: { error: Error }) {
  return <ErrorState message={error.message || "Something went wrong."} />;
}
