import { Badge } from "@/components/ui/badge";
import {
  CREDENTIAL_STATE_LABEL,
  credentialCategoryLabel,
  isCredentialInactive,
  publicCredentialState,
} from "@/lib/domain/credentials";
import { cn } from "@/lib/utils";
import type { ProfileCertification } from "@/lib/types/identity";

export function CredentialCard({ credential }: { credential: ProfileCertification }) {
  const inactive = isCredentialInactive(credential);
  const state = publicCredentialState(credential);
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        state === "revoked" && "border-rose-200 bg-rose-50/50",
        state === "expired" && "border-amber-200 bg-amber-50/40",
        !inactive && "border-border bg-white",
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {credentialCategoryLabel(credential.category)}
      </p>
      <p className="mt-1 text-sm font-medium">{credential.name}</p>
      {credential.issuer && <p className="text-xs text-muted-foreground">{credential.issuer}</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        {[credential.issueDate ? `Issued ${credential.issueDate}` : null, credential.expiryDate ? `Expires ${credential.expiryDate}` : null]
          .filter(Boolean)
          .join(" · ")}
      </p>
      {credential.credentialIdPublic && (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">{credential.credentialIdPublic}</p>
      )}
      <Badge
        variant={state === "verified" ? "verify" : state === "revoked" ? "warning" : inactive ? "warning" : "outline"}
        className="mt-2"
      >
        {CREDENTIAL_STATE_LABEL[state]}
      </Badge>
    </div>
  );
}
