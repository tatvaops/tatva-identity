"use client";

import { useEffect } from "react";
import { recordProjectView } from "@/lib/actions/growth";

export function RecordProjectView({ projectId }: { projectId: string }) {
  useEffect(() => {
    void recordProjectView(projectId);
  }, [projectId]);
  return null;
}
