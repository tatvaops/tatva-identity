import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, adminDate } from "@/features/admin/admin-chrome";
import { AdminActionButton } from "@/features/admin/admin-action";
import { AdminCertificationState, AdminReviewForm } from "@/features/admin/admin-forms";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminHideProfile, adminSetProfileVerification } from "@/lib/admin/actions";
import { getAdminPerson } from "@/lib/admin/data";

export const metadata: Metadata = { title: "Person" };

export default async function AdminPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getAdminPerson(id);
  if (!data) notFound();
  const { profile, requests, certifications } = data;
  return (
    <div>
      <AdminHeader
        title={profile.full_name}
        body={`@${profile.handle} · operator record. Public profile never includes documents, rates or Aadhaar.`}
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`/people/${profile.handle}`} className="text-sm text-primary hover:underline">
          Open public profile
        </Link>
        <Link href={`/passport/${profile.handle}`} className="text-sm text-primary hover:underline">
          Public passport
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Passport flags</p>
          <p className="mt-1 text-sm text-muted-foreground">{profile.headline || profile.about || "No headline yet."}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {profile.city}
            {profile.state ? `, ${profile.state}` : ""} · {profile.occupation_mode ?? "—"} · joined {adminDate(profile.created_at)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AdminActionButton
              label={profile.identity_verified ? "Clear identity" : "Verify identity"}
              action={adminSetProfileVerification.bind(null, profile.id, "identity", !profile.identity_verified)}
            />
            <AdminActionButton
              label={profile.employment_verified ? "Clear employment" : "Verify employment"}
              action={adminSetProfileVerification.bind(null, profile.id, "employment", !profile.employment_verified)}
            />
            <AdminActionButton
              label={profile.trade_verified ? "Clear trade" : "Verify trade"}
              action={adminSetProfileVerification.bind(null, profile.id, "trade", !profile.trade_verified)}
            />
            <AdminActionButton
              label={profile.admin_hidden ? "Unhide profile" : "Hide from discovery"}
              variant={profile.admin_hidden ? "outline" : "destructive"}
              action={adminHideProfile.bind(null, profile.id, !profile.admin_hidden)}
              confirm={profile.admin_hidden ? undefined : "Hide this profile from public discovery?"}
            />
          </div>
          <div className="mt-3 flex gap-1">
            {profile.identity_verified ? <Badge variant="verify">Identity</Badge> : <Badge variant="outline">Identity off</Badge>}
            {profile.employment_verified ? <Badge variant="success">Employment</Badge> : <Badge variant="outline">Employment off</Badge>}
            {profile.trade_verified ? <Badge variant="primary">Trade</Badge> : <Badge variant="outline">Trade off</Badge>}
            {profile.admin_hidden ? <Badge variant="warning">Hidden</Badge> : null}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-semibold">Verification requests</p>
          {requests.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {requests.map((request) => (
                <li key={request.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">
                    {request.kind} · {request.status}
                  </p>
                  <p className="text-xs text-muted-foreground">{adminDate(request.created_at)}</p>
                  {request.status === "pending" ? (
                    <div className="mt-2">
                      <AdminReviewForm requestId={request.id} />
                    </div>
                  ) : request.reviewer_note ? (
                    <p className="mt-2 text-sm text-muted-foreground">{request.reviewer_note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card className="mt-4 p-5">
        <p className="text-sm font-semibold">Credentials on the wallet</p>
        {certifications.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No certifications listed.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {certifications.map((cert) => (
              <li key={cert.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium">{cert.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.issuer} · {cert.category}
                    {cert.public_visible ? "" : " · not public"}
                  </p>
                </div>
                <AdminCertificationState id={cert.id} current={cert.verification_state} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
