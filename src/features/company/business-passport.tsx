import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUSINESS_CREDENTIAL_CATEGORIES,
  credentialStateLabel,
  organisationTypeLabel,
} from "@/lib/domain/org-config";
import type { OrgCredential, Organisation, VerificationState } from "@/lib/types/identity";

export function OrganisationMetricStrip({
  peopleCount,
  projectCount,
  serviceCount,
  jobCount,
}: {
  peopleCount: number;
  projectCount: number;
  serviceCount: number;
  jobCount: number;
}) {
  const metrics = [
    peopleCount > 0 ? { id: "people", label: "People", value: String(peopleCount) } : null,
    projectCount > 0 ? { id: "projects", label: "Projects", value: String(projectCount) } : null,
    serviceCount > 0 ? { id: "services", label: "Services", value: String(serviceCount) } : null,
    jobCount > 0 ? { id: "jobs", label: "Jobs", value: String(jobCount) } : null,
  ].filter((row): row is { id: string; label: string; value: string } => row !== null);
  if (metrics.length === 0) return null;
  return (
    <Card className="grid grid-cols-2 gap-px overflow-hidden bg-border sm:grid-cols-4">
      {metrics.map((metric) => (
        <div key={metric.id} className="bg-white px-4 py-3">
          <p className="text-lg font-semibold tabular-nums">{metric.value}</p>
          <p className="text-xs text-muted-foreground">{metric.label}</p>
        </div>
      ))}
    </Card>
  );
}

export function BusinessPassport({
  org,
  credentials,
}: {
  org: Organisation;
  credentials: OrgCredential[];
}) {
  const byCategory = new Map(credentials.map((c) => [c.category.toLowerCase(), c]));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business passport</CardTitle>
        <p className="text-sm text-muted-foreground">
          {organisationTypeLabel(org.type)} verification states. Documents are never public.
        </p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {BUSINESS_CREDENTIAL_CATEGORIES.map((category) => {
          const record = byCategory.get(category.id);
          const state = (record?.verificationState ?? "not_submitted") as VerificationState | "not_submitted";
          return (
            <div key={category.id} className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 ${state === "expired" ? "border-amber-200 bg-amber-50/40" : "border-border"}`}>
              <div>
                <p className="text-sm font-medium">{record?.name ?? category.label}</p>
                <p className="text-xs text-muted-foreground">{category.explanation}</p>
              </div>
              <Badge variant={state === "verified" ? "verify" : state === "expired" ? "warning" : "outline"}>
                {credentialStateLabel(state)}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
