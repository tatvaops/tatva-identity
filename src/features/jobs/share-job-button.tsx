"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { careerJobPath } from "@/lib/domain/career-routes";

export function ShareJobButton({ jobId }: Readonly<{ jobId: string }>) {
  const [label, setLabel] = useState("Share job");

  async function share() {
    const url = `${window.location.origin}${careerJobPath(jobId)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Open role", url });
      } else {
        await navigator.clipboard.writeText(url);
        setLabel("Link copied");
        window.setTimeout(() => setLabel("Share job"), 1800);
      }
    } catch {
      // Sharing was cancelled; keep the page unchanged.
    }
  }

  return (
    <Button type="button" variant="outline" onClick={() => void share()}>
      {label}
    </Button>
  );
}
