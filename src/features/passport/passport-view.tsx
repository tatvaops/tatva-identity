import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PassportStrength } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { ProfileSectionEdit } from "@/features/profile/profile-edit";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";
import type { PublicProfile, Experience, ProfileSkill, ProfileCertification, NetworkProject, RecommendationRow } from "@/lib/types/identity";

const SECTIONS = [
  ["overview", "Overview"],
  ["experience", "Experience"],
  ["projects", "Projects"],
  ["skills", "Skills"],
  ["certifications", "Certifications"],
  ["documents", "Documents"],
  ["reputation", "Reputation"],
  ["availability", "Availability"],
] as const;

export function PassportView({
  profile,
  section = "overview",
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
  const current = SECTIONS.some(([id]) => id === section) ? section : "overview";

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h1 className="text-xl font-semibold">Professional passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Private workspace for {profile.fullName}. Public identity:{" "}
          <Link className="text-primary" href={`/people/${profile.handle}`}>
            /people/{profile.handle}
          </Link>
        </p>
      </Card>
      <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1">
        {SECTIONS.map(([id, label]) => (
          <Link
            key={id}
            href={id === "overview" ? "/passport" : `/passport/${id}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
              current === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      {current === "overview" && (
        <Card className="p-5">
          <PassportStrength completeness={strength.completeness} components={strength.components} />
        </Card>
      )}
      {current === "experience" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="experience" label="Add experience" />
          </div>
          {experiences.length === 0 ? (
            <EmptyState title="No experience yet" body="Add roles from your profile." />
          ) : (
            <Card className="space-y-2 p-5 text-sm">
              {experiences.map((e) => (
                <p key={e.id}>
                  {e.title} · {e.source.replace("_", " ")}
                </p>
              ))}
            </Card>
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
            <Card className="p-5 text-sm">
              {projects.map((p) => (
                <p key={p.id}>{p.name}</p>
              ))}
            </Card>
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
            <Card className="p-5 text-sm">
              {skills.map((s) => (
                <p key={s.id}>
                  {s.skillName} · {s.verificationLevel.replaceAll("_", " ")}
                </p>
              ))}
            </Card>
          )}
        </div>
      )}
      {current === "certifications" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="certification" label="Add credential" />
          </div>
          {certifications.length === 0 ? (
            <EmptyState title="No public credentials yet" body="Choose which credentials are visible on the public passport." />
          ) : (
            <Card className="p-5 text-sm">
              {certifications.map((c) => (
                <p key={c.id}>{c.name}</p>
              ))}
            </Card>
          )}
        </div>
      )}
      {current === "documents" && (
        <Card className="p-5 text-sm text-muted-foreground">
          KYC documents stay in private storage. Public profile only shows verification state.
        </Card>
      )}
      {current === "reputation" && (
        <Card>
          <CardHeader>
            <CardTitle>Reputation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reliability charts will use derived Vertex summaries, never raw attendance. Nothing to plot until that
            feed exists.
          </CardContent>
        </Card>
      )}
      {current === "availability" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="availability" label="Edit availability" />
          </div>
          <Card className="p-5 text-sm">Status: {profile.availabilityStatus.replaceAll("_", " ")}</Card>
        </div>
      )}
    </div>
  );
}
