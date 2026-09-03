import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassportStrength } from "@/components/cards/entity-cards";
import { CredentialCard } from "@/components/identity/credential-card";
import { EmptyState } from "@/components/states/empty-state";
import { ProfileSectionEdit } from "@/features/profile/profile-edit";
import { AvailabilityBadge } from "@/components/identity/verification";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";
import { CREDENTIAL_CATEGORIES } from "@/lib/domain/credentials";
import { flagsFromEvidence, headerFlags, SKILL_LEVEL_LABEL } from "@/lib/domain/verification";
import { VerificationBadge } from "@/components/identity/verification";
import { ProjectCard } from "@/components/cards/entity-cards";
import { resolvePassportSection } from "@/lib/domain/passport-workspace";
import type {
  PublicProfile,
  Experience,
  ProfileSkill,
  ProfileCertification,
  NetworkProject,
  RecommendationRow,
} from "@/lib/types/identity";

const SECTION_NAV = [
  ["identity", "Identity"],
  ["employment", "Employment"],
  ["skills", "Skills"],
  ["projects", "Projects"],
  ["credentials", "Credentials"],
  ["references", "References"],
  ["availability", "Availability"],
  ["documents", "Documents"],
] as const;

export function PassportView({
  profile,
  section = "identity",
  experiences,
  skills,
  certifications,
  projects,
  recommendations,
}: {
  profile: PublicProfile;
  section?: string;
  experiences: Experience[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  projects: NetworkProject[];
  recommendations: RecommendationRow[];
}) {
  const strength = calculatePassportStrength({
    identityVerified: profile.identityVerified,
    employmentVerified: profile.employmentVerified,
    skillCount: skills.length,
    publicCredentialCount: certifications.length,
    projectCount: projects.length,
    recommendationCount: recommendations.length,
  });
  const current = resolvePassportSection(section);
  const flags = headerFlags(flagsFromEvidence({ profile, skills, certifications, projects }));

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Professional passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private workspace. Public QR passport:{" "}
          <Link className="text-primary" href={`/passport/${profile.handle}`}>
            /passport/{profile.handle}
          </Link>
        </p>
      </Card>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {SECTION_NAV.map(([id, label]) => (
          <Link
            key={id}
            href={`/passport?section=${id}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              current === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      {current === "identity" && (
        <div className="space-y-3">
          <PassportStrength completeness={strength.completeness} components={strength.components} />
          <Card className="p-4">
            <p className="text-sm font-semibold">Verification</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {flags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No completed checks yet. Documents stay private when submitted.</p>
              ) : (
                flags.map((flag) => <VerificationBadge key={flag.kind} flag={flag} />)
              )}
            </div>
          </Card>
        </div>
      )}
      {current === "employment" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="experience" label="Add experience" />
          </div>
          {experiences.length === 0 ? (
            <EmptyState title="No experience yet" body="Self-declared roles stay here. Verified work history comes from Vertex." />
          ) : (
            <div className="space-y-2">
              {experiences.map((e) => (
                <Card key={e.id} className="p-4 text-sm">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-muted-foreground">{e.organisationNameText}</p>
                  <p className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {e.source === "organisation_verified" ? "Organisation verified" : "Self declared"}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {current === "projects" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="project" label="Add project" />
          </div>
          {projects.length === 0 ? (
            <EmptyState title="No projects yet" body="Opted-in contributions appear here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      )}
      {current === "skills" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="skill" label="Add skill" />
          </div>
          {skills.length === 0 ? (
            <EmptyState title="No skills yet" body="Skill verification levels are public; evidence files are not." />
          ) : (
            <Card className="flex flex-wrap gap-2 p-5">
              {skills.map((s) => (
                <p key={s.id} className="rounded-xl border border-border px-3 py-2 text-sm">
                  {s.skillName} · {SKILL_LEVEL_LABEL[s.verificationLevel]}
                </p>
              ))}
            </Card>
          )}
        </div>
      )}
      {current === "credentials" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Credential wallet. Files stay private.</p>
            <ProfileSectionEdit kind="certification" label="Add credential" />
          </div>
          {certifications.length === 0 ? (
            <EmptyState title="No public credentials yet" body="Choose which credentials are visible on the public passport." />
          ) : (
            CREDENTIAL_CATEGORIES.map((category) => {
              const items = certifications.filter((c) => c.category === category.id);
              if (items.length === 0) return null;
              return (
                <div key={category.id}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{category.label}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((c) => (
                      <CredentialCard key={c.id} credential={c} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {current === "documents" && (
        <Card className="p-5 text-sm text-muted-foreground">
          KYC documents stay in private storage. The public QR passport only shows verification state.
        </Card>
      )}
      {current === "references" && (
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {recommendations.length === 0 ? (
              <p className="text-muted-foreground">No references yet.</p>
            ) : (
              recommendations.map((r) => (
                <blockquote key={r.id} className="border-l-2 border-primary/30 pl-3">
                  “{r.body}”
                  <footer className="mt-1 text-xs text-muted-foreground">{r.relationship}</footer>
                </blockquote>
              ))
            )}
          </CardContent>
        </Card>
      )}
      {current === "availability" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="availability" label="Edit availability" />
          </div>
          <Card className="p-5">
            <AvailabilityBadge status={profile.availabilityStatus} />
          </Card>
        </div>
      )}
    </div>
  );
}
