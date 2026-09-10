import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PassportStrength, ProjectCard } from "@/components/cards/entity-cards";
import { CredentialCard } from "@/components/identity/credential-card";
import { EmptyState } from "@/components/states/empty-state";
import { ProfileSectionEdit } from "@/features/profile/profile-edit";
import { AskRecommendationForm } from "@/features/profile/recommend-request";
import { OwnerDeleteButton } from "@/components/identity/owner-delete-button";
import { PhotoFrame } from "@/components/identity/media-photo";
import {
  removeCertification,
  removeEducation,
  removeEvidenceItem,
  removeExperience,
  removePortfolioItem,
  removeProfileService,
  removeSkill,
  removeSkillFact,
} from "@/lib/actions/profile";
import { AvailabilityBadge, VerificationBadge } from "@/components/identity/verification";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";
import { passportNextActions } from "@/lib/domain/passport-next";
import { CREDENTIAL_CATEGORIES } from "@/lib/domain/credentials";
import { flagsFromEvidence, headerFlags, SKILL_LEVEL_LABEL } from "@/lib/domain/verification";
import { resolvePassportSection } from "@/lib/domain/passport-workspace";
import { evidenceTrustLabel } from "@/lib/domain/evidence";
import { publicMediaUrl } from "@/lib/media/public-url";
import type {
  EvidenceItem,
  Experience,
  NetworkProject,
  ProfileCertification,
  ProfileEducation,
  ProfileService,
  ProfileSkill,
  PublicProfile,
  RecommendationRow,
} from "@/lib/types/identity";

const SECTION_NAV = [
  ["identity", "Identity"],
  ["employment", "Employment"],
  ["skills", "Skills"],
  ["services", "Services"],
  ["projects", "Projects"],
  ["credentials", "Credentials"],
  ["education", "Education"],
  ["references", "References"],
  ["availability", "Availability"],
  ["evidence", "Evidence"],
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
  education = [],
  portfolio = [],
  facts = [],
  services = [],
  evidence = [],
}: {
  profile: PublicProfile;
  section?: string;
  experiences: Experience[];
  skills: ProfileSkill[];
  certifications: ProfileCertification[];
  projects: NetworkProject[];
  recommendations: RecommendationRow[];
  education?: ProfileEducation[];
  portfolio?: Array<{
    id: string;
    image_url: string;
    caption: string | null;
    work_category: string | null;
    location: string | null;
    supervisor_verified: boolean;
    brand_verified: boolean;
  }>;
  facts?: Array<{
    id: string;
    skill_name: string;
    proficiency: string | null;
    years_experience: number | null;
    verified_projects: number;
  }>;
  services?: ProfileService[];
  evidence?: EvidenceItem[];
}) {
  const strength = calculatePassportStrength({
    identityVerified: profile.identityVerified,
    employmentVerified: profile.employmentVerified,
    skillCount: skills.length,
    publicCredentialCount: certifications.length,
    projectCount: projects.length,
    recommendationCount: recommendations.length,
    hasName: Boolean(profile.fullName.trim() && profile.fullName !== "New professional"),
    hasPhoto: Boolean(profile.avatarPath),
    hasHeadline: Boolean(profile.headline),
    hasLocation: Boolean(profile.city),
    experienceCount: experiences.length,
    educationCount: education.length,
  });
  const next = passportNextActions({
    profile,
    skillCount: skills.length,
    projectCount: projects.length,
    experienceCount: experiences.length,
    credentialCount: certifications.length,
    educationCount: education.length,
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
          {next.length > 0 ? (
            <Card className="p-4">
              <p className="text-sm font-semibold">Recommended next action</p>
              <ul className="mt-2 space-y-2 text-sm">
                {next.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="font-medium text-primary hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-muted-foreground">{item.why}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card className="p-4">
            <p className="text-sm font-semibold">Identity</p>
            <p className="mt-1 text-sm">{profile.fullName}</p>
            <p className="text-sm text-muted-foreground">{profile.headline ?? "No headline yet"}</p>
            {profile.languages.length > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Languages: {profile.languages.join(", ")}</p>
            ) : null}
            {profile.specialisation ? (
              <p className="text-sm text-muted-foreground">Specialisation: {profile.specialisation}</p>
            ) : null}
          </Card>
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
                <Card key={e.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-muted-foreground">{e.organisationNameText}</p>
                    <p className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                      {e.isCurrent ? "Current · " : ""}
                      {e.source === "organisation_verified" ? "Organisation verified" : "Self declared"}
                    </p>
                  </div>
                  {e.source === "self_declared" ? (
                    <OwnerDeleteButton onDelete={() => removeExperience({ id: e.id })} />
                  ) : null}
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="type-micro text-brand">Passport section</p>
              <h2 className="type-section">Skills</h2>
            </div>
            <ProfileSectionEdit kind="skill" label="Add skill" />
          </div>
          {skills.length === 0 ? (
            <EmptyState title="No skills yet" body="Skill verification levels are public; evidence files are not." />
          ) : (
            <Card className="flex flex-wrap gap-2 p-5">
              {skills.map((s) => (
                <p key={s.id} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm">
                  {s.skillName} · {SKILL_LEVEL_LABEL[s.verificationLevel]}
                  {s.verificationLevel === "self_declared" ? (
                    <OwnerDeleteButton onDelete={() => removeSkill({ id: s.id })} />
                  ) : null}
                </p>
              ))}
            </Card>
          )}
        </div>
      )}
      {current === "services" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="service" label="Add service" />
          </div>
          {services.length === 0 ? (
            <EmptyState title="No services listed" body="Add a service if clients should be able to request this work from you." />
          ) : (
            services.map((item) => (
              <Card key={item.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-muted-foreground">{item.description}</p>
                  {item.locations.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">{item.locations.join(", ")}</p>
                  ) : null}
                </div>
                <OwnerDeleteButton onDelete={() => removeProfileService({ id: item.id })} />
              </Card>
            ))
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
                      <div key={c.id} className="space-y-1">
                        <CredentialCard credential={c} />
                        <OwnerDeleteButton onDelete={() => removeCertification({ id: c.id })} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
      {current === "education" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ProfileSectionEdit kind="education" label="Add education" />
          </div>
          <p className="text-sm text-muted-foreground">
            Education and training records. Certifications can also live in Credentials.
          </p>
          {education.length === 0 ? (
            <EmptyState title="No education or training yet" body="Add an institution or course when it is relevant to the work you do." />
          ) : (
            education.map((item) => (
              <Card key={item.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-semibold">{item.institution}</p>
                  <p className="text-muted-foreground">{[item.qualification, item.course, item.fieldOfStudy].filter(Boolean).join(" · ")}</p>
                </div>
                <OwnerDeleteButton onDelete={() => removeEducation({ id: item.id })} />
              </Card>
            ))
          )}
        </div>
      )}
      {current === "documents" && (
        <Card className="space-y-3 p-5 text-sm">
          <p className="text-muted-foreground">
            KYC documents stay in private storage. The public QR passport only shows verification state.
          </p>
          <Button asChild>
            <Link href="/passport/documents">Open document vault</Link>
          </Button>
        </Card>
      )}
      {current === "references" && (
        <Card>
          <CardHeader>
            <CardTitle>References</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {recommendations.length === 0 ? (
              <p className="text-muted-foreground">No references yet. Ask someone you have worked with.</p>
            ) : (
              recommendations.map((r) => (
                <blockquote key={r.id} className="border-l-2 border-primary/30 pl-3">
                  “{r.body}”
                  <footer className="mt-1 text-xs text-muted-foreground">{r.relationship}</footer>
                </blockquote>
              ))
            )}
            <AskRecommendationForm />
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
      {current === "evidence" && (
        <div className="space-y-3">
          <div className="flex flex-wrap justify-end gap-2">
            <ProfileSectionEdit kind="evidence" label="Add work photo" />
            <ProfileSectionEdit kind="skillFact" label="Add skill fact" />
            <ProfileSectionEdit kind="service" label="Add service" />
          </div>
          {portfolio.length === 0 && facts.length === 0 && evidence.length === 0 ? (
            <EmptyState
              title="Claimed evidence"
              body="Work photos and skill facts you add here are claimed until a supervisor or operator confirms them. They never appear as verified on their own."
            />
          ) : (
            <div className="space-y-4">
              {portfolio.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {portfolio.map((item) => (
                    <Card key={item.id} className="overflow-hidden">
                      <PhotoFrame src={item.image_url} alt={item.caption ?? "Work photo"} className="h-40" />
                      <div className="flex items-start justify-between gap-2 p-3">
                        <div>
                          <p className="text-sm font-semibold">{item.caption ?? item.work_category ?? "Work photo"}</p>
                          <p className="text-xs text-muted-foreground">{item.location}</p>
                          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {item.supervisor_verified || item.brand_verified ? "Verified" : "Claimed"}
                          </p>
                        </div>
                        {!item.supervisor_verified && !item.brand_verified ? (
                          <OwnerDeleteButton onDelete={() => removePortfolioItem({ id: item.id })} />
                        ) : null}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : null}
              {facts.length > 0 ? (
                <div className="space-y-2">
                  {facts.map((fact) => (
                    <Card key={fact.id} className="flex items-start justify-between gap-3 p-4 text-sm">
                      <div>
                        <p className="font-semibold">{fact.skill_name}</p>
                        <p className="text-muted-foreground">
                          {[fact.proficiency, fact.years_experience ? `${fact.years_experience} yrs` : null]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {fact.verified_projects > 0 ? `${fact.verified_projects} verified projects` : "Claimed skill fact"}
                        </p>
                      </div>
                      {fact.verified_projects === 0 ? (
                        <OwnerDeleteButton onDelete={() => removeSkillFact({ id: fact.id })} />
                      ) : null}
                    </Card>
                  ))}
                </div>
              ) : null}
              {evidence.length > 0 ? (
                <div className="space-y-2">
                  {evidence.map((item) => {
                    const trust = evidenceTrustLabel({
                      verificationState: item.verificationState,
                      hasMedia: Boolean(item.mediaPath),
                      operatorVerified: item.verificationState === "verified",
                    });
                    const src = publicMediaUrl(item.mediaPath);
                    return (
                      <Card key={item.id} className="space-y-2 p-4 text-sm">
                        {src ? <PhotoFrame src={src} alt={item.note ?? "Evidence"} className="h-40" /> : null}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{item.note ?? item.claimKind}</p>
                            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                              {trust.label}
                            </p>
                            <p className="text-xs text-muted-foreground">{trust.detail}</p>
                          </div>
                          {item.verificationState !== "verified" ? (
                            <OwnerDeleteButton onDelete={() => removeEvidenceItem({ id: item.id })} />
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
