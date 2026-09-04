"use client";

import { useEffect } from "react";
import { recordOrganisationView } from "@/lib/actions/growth";

export function RecordOrgView({ organisationId }: { organisationId: string }) {
  useEffect(() => {
    void recordOrganisationView(organisationId);
  }, [organisationId]);
  return null;
}
