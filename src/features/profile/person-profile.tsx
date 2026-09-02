import Link from "next/link";
import { MapPin } from "lucide-react";
import { CompanyCard, PassportStrength, ProjectCard, ServiceLedger } from "@/components/cards/entity-cards";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { CoverBand, InitialsAvatar } from "@/components/identity/visuals";
import { ConnectionButton, FollowButton } from "@/components/identity/network-buttons";
import { EmptyState } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HireBoundary } from "@/features/profile/hire-boundary";
import { ProfileEditDialogs } from "@/features/profile/profile-edit";
import { calculatePassportStrength, hireLabel, hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { flagsFromProfile } from "@/lib/domain/verification";
import { getVerifiedWorkHistory } from "@/lib/integrations/vertex";
import { getOrganisationById, isFollowing, getConnectionState } from "@/lib/data/network";
import { getAuthContext } from "@/lib/data/query";
import type {
  Experience,
  NetworkProject,
  Post,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  RecommendationRow,
} from "@/lib/types/identity";

export async function PersonProfileView({
  profile,
  experiences,
  skills,
  certifications,
  recommendations,
  projects,
  posts,
}: {
  profile: PublicProfile;
  experiences: Experience[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  recommendations: RecommendationRow[];
  projects: NetworkProject[];
  posts: Post[];
}) {
  const session = await getAuthContext();
  const org = profile.currentOrganisationId ? (await getOrganisationById(profile.currentOrganisationId)).data : null;
  const ledger = await getVerifiedWorkHistory(profile.id);
  const passport = calculatePassportStrength({
    identityVerified: profile.identityVerified,
    employmentVerified: profile.employmentVerified,
    skillCount: skills.length,
    publicCredentialCount: certifications.length,
    projectCount: projects.length,
    recommendationCount: recommendations.length,
  });
  const flags = flagsFromProfile(profile);
  const connectionState =
    session.userId && session.userId !== profile.id
      ? await getConnectionState(session.userId, profile.id)
      : "connect";
  const following =
    session.userId && session.userId !== profile.id
      ? await isFollowing(session.userId, { personId: profile.id })
      : false;
  const cta = hireLabel(profile.occupationMode);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CoverBand tone="site" className="h-36 md:h-44" />
        <div className="px-4 pb-5 md:px-6">
          <div className="-mt-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <InitialsAvatar
                initials={initialsFromName(profile.fullName)}
                hue={hueFromId(profile.id)}
                size={112}
                className="ring-4 ring-white"
              />
              <div className="hidden pb-1 md:block">
                <AvailabilityBadge status={profile.availabilityStatus} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <ConnectionButton profileId={profile.id} initialState={connectionState} />
              <FollowButton personId={profile.id} following={following} />
              <Button variant="outline" asChild>
                <Link href={session.userId ? "/messages" : "/auth/sign-in?next=/messages"}>Message</Link>
              </Button>
              <HireBoundary label={cta} />
              {session.userId === profile.id && <ProfileEditDialogs />}
            </div>
          </div>
          <div className="mt-4 md:hidden">
            <AvailabilityBadge status={profile.availabilityStatus} />
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {flags.map((v) => (
              <VerificationBadge key={v.kind} flag={v} />
            ))}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{profile.headline}</p>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {profile.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {[profile.locality, profile.city, profile.state].filter(Boolean).join(", ")}
              </span>
            )}
            {org && (
              <Link href={`/companies/${org.slug}`} className="text-primary hover:underline">
                {org.name}
              </Link>
            )}
            {profile.workerPassportId && (
              <span className="font-mono text-xs">Worker passport linked</span>
            )}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.about ? (
                <p className="text-sm leading-6">{profile.about}</p>
              ) : (
                <p className="text-sm text-muted-foreground">No about section yet.</p>
              )}
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                {profile.languages.length > 0 && <p>Languages: {profile.languages.join(", ")}</p>}
                {profile.preferredWorkLocations.length > 0 && (
                  <p>Preferred locations: {profile.preferredWorkLocations.join(", ")}</p>
                )}
                <p>Relocate: {profile.willingToRelocate ? "Yes" : "No"}</p>
                <p>Travel: {profile.willingToTravel ? "Yes" : "No"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional passport</CardTitle>
            </CardHeader>
            <CardContent>
              <PassportStrength completeness={passport.completeness} components={passport.components} />
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-2 text-[15px] font-semibold">Experience</h2>
            {experiences.length === 0 ? (
              <EmptyState title="No experience yet" body="Self-declared roles will appear here. Verified engagements stay in work history." />
            ) : (
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <Card key={exp.id} className="p-4">
                    <p className="text-sm font-semibold">{exp.title}</p>
                    <p className="text-sm text-muted-foreground">{exp.organisationNameText}</p>
                    <Badge className="mt-2">{exp.source === "self_declared" ? "Self declared" : "Organisation verified"}</Badge>
                    <ul className="mt-2 list-disc pl-4 text-sm text-muted-foreground">
                      {exp.responsibilities.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Verified work history</CardTitle>
              <p className="text-sm text-muted-foreground">
                Derived from Tatva operational records when Vertex is connected. Not an editable resume.
              </p>
            </CardHeader>
            <CardContent>
              {ledger.length === 0 ? (
                <p className="text-sm text-muted-foreground">No verified work history yet.</p>
              ) : (
                <ServiceLedger rows={ledger} />
              )}
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-2 text-[15px] font-semibold">Projects</h2>
            {projects.length === 0 ? (
              <EmptyState title="No projects have been added" body="Opted-in contributions will show here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills yet.</p>}
              {skills.map((s) => (
                <div key={s.id} className="rounded-xl border border-border px-3 py-2">
                  <p className="text-sm font-medium">{s.skillName}</p>
                  <p className="text-[11px] text-muted-foreground">{s.verificationLevel.replaceAll("_", " ")}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Credentials</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {certifications.length === 0 && (
                <p className="text-sm text-muted-foreground">No public credentials yet.</p>
              )}
              {certifications.map((c) => (
                <div key={c.id} className="rounded-xl border border-border p-3">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.issuer}</p>
                  <Badge variant="verify" className="mt-2">
                    {c.verificationState.replaceAll("_", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recommendations.length === 0 && (
                <p className="text-sm text-muted-foreground">No recommendations yet.</p>
              )}
              {recommendations.map((r) => (
                <blockquote key={r.id} className="border-l-2 border-primary/30 pl-3 text-sm">
                  “{r.body}”
                  <footer className="mt-1 text-xs text-muted-foreground">{r.relationship}</footer>
                </blockquote>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold">Posts</h2>
            {posts.length === 0 ? (
              <EmptyState title="No posts yet" body="Updates from this professional will appear here." />
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} author={profile} />)
            )}
          </div>
        </div>
        <aside className="hidden space-y-4 lg:block">
          <Card className="p-4">
            <p className="text-sm font-semibold">Availability</p>
            <div className="mt-2">
              <AvailabilityBadge status={profile.availabilityStatus} />
            </div>
            {profile.preferredRoles.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">{profile.preferredRoles.join(", ")}</p>
            )}
          </Card>
          {org && (
            <div>
              <p className="mb-2 text-sm font-semibold">Organisation</p>
              <CompanyCard org={org} />
            </div>
          )}
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-white p-3 lg:hidden">
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" asChild>
            <Link href={session.userId ? "/messages" : "/auth/sign-in"}>Message</Link>
          </Button>
          <div className="flex-1">
            <HireBoundary label="Hire" fullWidth />
          </div>
        </div>
      </div>
    </div>
  );
}
