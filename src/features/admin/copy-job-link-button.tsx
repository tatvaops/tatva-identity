"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { careerJobPath } from "@/lib/domain/career-routes";

export function CopyJobLinkButton({ jobId }: Readonly<{ jobId: string }>) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = `${window.location.origin}${careerJobPath(jobId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this job link:", url);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? "Copied" : "Copy apply link"}
    </Button>
  );
}
