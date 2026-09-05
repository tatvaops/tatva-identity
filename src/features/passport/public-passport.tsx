import Link from "next/link";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { CoverBand, InitialsAvatar } from "@/components/identity/visuals";
import { PassportQr } from "@/components/identity/passport-qr";
import { CredentialCard } from "@/components/identity/credential-card";
import { PassportStrength, ProjectCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";
import { CREDENTIAL_CATEGORIES } from "@/lib/domain/credentials";
import { headerFlags, flagsFromEvidence, SKILL_LEVEL_LABEL } from "@/lib/domain/verification";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { personPublicHref } from "@/lib/domain/identiti-routes";
import { product } from "@/lib/config";
import type {
  Experience,
  NetworkProject,
  ProfileCertification,
  ProfileSkill,
  PublicProfile,
  RecommendationRow,
} from "@/lib/types/identity";

export async function PublicPassportView({
  profile,
  experiences,
  skills,
  certifications,
  projects,
  recommendations,
  origin,
}: {
  profile: PublicProfile;
  experiences: Experience[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  projects: NetworkProject[];
  recommendations: RecommendationRow[];
  origin: string;
}) {
  const url = `${origin}/passport/${profile.handle}`;
  const passport = calculatePassportStrength({
    identityVerified: profile.identityVerified,
    employmentVerified: profile.employmentVerified,
    skillCount: skills.length,
    publicCredentialCount: certifications.length,
    projectCount: projects.length,
    recommendationCount: recommendations.length,
  });
  const flags = headerFlags(flagsFromEvidence({ profile, skills, certifications, projects }));
  const verifiedExperience = experiences.filter((e) => e.source === "organisation_verified");

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Card className="overflow-hidden print:shadow-none">
        {profile.coverPath ? <CoverBand tone="site" className="h-28" src={profile.coverPath} /> : null}
        <div className="px-5 pb-5">
          <div className={`${profile.coverPath ? "-mt-10" : "pt-5"} flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`}>
            <InitialsAvatar
              initials={initialsFromName(profile.fullName)}
              hue={hueFromId(profile.id)}
              size={88}
              className="ring-4 ring-white"
              src={profile.avatarPath}
            />
            <div className="hidden print:block">
              <PassportQr url={url} />
            </div>
          </div>
          <p className="mt-4 text-[11px] font-semibold tracking-[0.16em] text-indigo-800 uppercase">
            {product.name} professional passport
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{profile.fullName}</h1>
          {profile.headline && <p className="mt-1 text-sm text-foreground">{profile.headline}</p>}
          <div className="mt-3">
            <AvailabilityBadge status={profile.availabilityStatus} />
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {flags.length === 0 ? (
              <p className="text-xs text-muted-foreground">Verification has not been completed yet.</p>
            ) : (
              flags.map((flag) => <VerificationBadge key={flag.kind} flag={flag} />)
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Limited public view. Identity documents, rates and private files are never shown here.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
        <PassportStrength
          completeness={passport.completeness}
          components={passport.components}
          hrefFor={(id) => `#${id}`}
        />
        <Card className="flex flex-col items-center p-4 print:hidden">
          <PassportQr url={url} />
          <p className="mt-2 text-center text-xs text-muted-foreground">Scan to open this passport</p>
          <Button className="mt-3 w-full" variant="outline" asChild>
            <Link href={personPublicHref(profile.handle, profile.occupationMode)}>Full profile</Link>
          </Button>
        </Card>
      </div>

      <section id="identity" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">Identity</h2>
        <Card className="p-4 text-sm">
          {profile.identityVerified
            ? "Identity is verified. Document numbers stay private."
            : "Identity is not verified yet."}
        </Card>
      </section>

      <section id="employment" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">Employment</h2>
        {verifiedExperience.length === 0 && experiences.length === 0 ? (
          <EmptyState title="No employment on this passport" body="Organisation-verified roles appear here when confirmed." />
        ) : (
          <div className="space-y-2">
            {(verifiedExperience.length > 0 ? verifiedExperience : experiences).map((exp) => (
              <Card key={exp.id} className="p-4">
                <p className="text-sm font-semibold">{exp.title}</p>
                <p className="text-sm text-muted-foreground">{exp.organisationNameText}</p>
                <p className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  {exp.source === "organisation_verified" ? "Organisation verified" : "Self declared"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section id="skills" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">Skills</h2>
        {skills.length === 0 ? (
          <EmptyState title="No skills on this passport" body="Public skills and their verification level will appear here." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <div key={skill.id} className="rounded-xl border border-border bg-white px-3 py-2">
                <p className="text-sm font-medium">{skill.skillName}</p>
                <p className="text-[11px] text-muted-foreground">{SKILL_LEVEL_LABEL[skill.verificationLevel]}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="projects" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">Projects</h2>
        {projects.length === 0 ? (
          <EmptyState title="No verified projects yet" body="Opted-in project work links to the canonical project page." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <section id="credentials" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">Credentials</h2>
        {certifications.length === 0 ? (
          <EmptyState title="No public credentials yet" body="Credential files stay private. Only public state is shown." />
        ) : (
          <div className="space-y-4">
            {CREDENTIAL_CATEGORIES.map((category) => {
              const items = certifications.filter((c) => c.category === category.id);
              if (items.length === 0) return null;
              return (
                <div key={category.id}>
                  <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{category.label}</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {items.map((item) => (
                      <CredentialCard key={item.id} credential={item} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section id="references" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">References</h2>
        {recommendations.length === 0 ? (
          <EmptyState title="No public references yet" body="Verified references will appear on this passport." />
        ) : (
          <div className="space-y-2">
            {recommendations.map((row) => (
              <Card key={row.id} className="p-4 text-sm">
                “{row.body}”
                <p className="mt-1 text-xs text-muted-foreground">{row.relationship}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section id="availability" className="scroll-mt-20">
        <h2 className="mb-2 text-[15px] font-semibold">Availability</h2>
        <Card className="p-4">
          <AvailabilityBadge status={profile.availabilityStatus} />
          {profile.preferredRoles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {profile.preferredRoles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
