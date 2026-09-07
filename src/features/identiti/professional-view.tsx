import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InitialsAvatar, CoverBand } from "@/components/identity/visuals";
import { PhotoFrame } from "@/components/identity/media-photo";
import { ProofStrip } from "@/components/ui/section";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import { IdentitiNetworkBar } from "@/features/identiti/identiti-network-bar";
import { IdentitiChip, IdentitiSection, visibleAbout } from "@/features/identiti/identiti-chrome";
import { RecommendForm } from "@/features/profile/recommend-form";
import { availabilityLabel } from "@/lib/domain/availability";
import { showAvailability, viewerFromNetwork } from "@/lib/domain/visibility";
import type { Experience, Post, ProfileCertification, ProfileEducation, ProfileService, ProfileSkill, PublicProfile, RecommendationRow } from "@/lib/types/identity";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";
import { SKILL_LEVEL_LABEL } from "@/lib/domain/verification";

export function ProfessionalView({
  profile,
  projects,
  employer,
  experiences,
  certifications,
  recommendations,
  posts = [],
  skills = [],
  services = [],
  education = [],
  connectionState = "connect",
  following = false,
  signedIn = false,
  isOwner = false,
  isRecruiter = false,
  saved = false,
  blocked = false,
}: {
  profile: PublicProfile;
  projects: IdentitiProject[];
  employer: IdentitiBrand | null;
  experiences: Experience[];
  certifications: ProfileCertification[];
  recommendations: RecommendationRow[];
  posts?: Post[];
  skills?: ProfileSkill[];
  services?: ProfileService[];
  education?: ProfileEducation[];
  connectionState?: "connect" | "pending" | "incoming" | "connected";
  following?: boolean;
  signedIn?: boolean;
  isOwner?: boolean;
  isRecruiter?: boolean;
  saved?: boolean;
  blocked?: boolean;
}) {
  const verifiedProjects = projects.filter((project) => project.verified);
  const viewer = viewerFromNetwork({ isOwner, connectionState, isRecruiter });
  const availability = showAvailability(profile, viewer) ? availabilityLabel(profile.availabilityStatus) : null;
  const about = visibleAbout(profile.about);
  return (
    <div className="space-y-10 pb-14">
      <section className="overflow-hidden border border-border bg-white">
        <CoverBand tone="office" className="h-40 md:h-48" src={profile.coverPath} />
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <InitialsAvatar
              initials={initialsFromName(profile.fullName)}
              hue={hueFromId(profile.id)}
              size={96}
              src={profile.avatarPath}
              className="ring-4 ring-white"
            />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href={`/passport/${profile.handle}`}>Career passport</Link>
              </Button>
              {isOwner ? (
                <Button asChild>
                  <Link href="/passport">Edit passport</Link>
                </Button>
              ) : null}
              <IdentitiNetworkBar
                profile={profile}
                connectionState={connectionState}
                following={following}
                signedIn={signedIn}
                isOwner={isOwner}
                saved={saved}
                blocked={blocked}
              />
            </div>
          </div>
          <p className="mt-5 type-micro text-brand">Professional</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {profile.identityVerified ? <Badge variant="verify">Verified identity</Badge> : null}
            {profile.employmentVerified ? <Badge variant="verify">Verified employment</Badge> : null}
          </div>
          <h1 className="type-display mt-3 text-4xl sm:text-5xl">{profile.fullName}</h1>
          <p className="mt-2 text-base text-text-secondary">{profile.headline}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {[
              profile.specialisation ?? profile.preferredRoles[0] ?? profile.professionalTitle,
              profile.city,
              employer?.name,
              profile.yearsExperience ? `${profile.yearsExperience} yrs` : null,
              availability,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {employer ? (
            <p className="mt-2 text-sm">
              Works with{" "}
              <Link href={brandPublicHref(employer.passportKind, employer.slug)} className="font-medium text-brand hover:underline">
                {employer.name}
              </Link>
            </p>
          ) : null}
        </div>
        <ProofStrip
          items={[
            { label: "Experience", value: experiences.length ? String(experiences.length) : "—" },
            { label: "Projects", value: String(verifiedProjects.length || projects.length || "—") },
            { label: "Skills", value: skills.length ? String(skills.length) : "—" },
            { label: "Certifications", value: certifications.length ? String(certifications.length) : "—" },
            { label: "Reviews", value: recommendations.length ? String(recommendations.length) : "—" },
          ]}
        />
      </section>

      {about ? (
        <IdentitiSection eyebrow="About" title="Professional summary">
          <p className="max-w-3xl text-[17px] leading-8 text-text-secondary">{about}</p>
          {profile.languages.length > 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Languages: {profile.languages.join(", ")}</p>
          ) : null}
          {profile.industriesServed.length > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">Industries: {profile.industriesServed.join(", ")}</p>
          ) : null}
        </IdentitiSection>
      ) : null}

      {skills.length > 0 ? (
        <IdentitiSection eyebrow="Expertise" title="Skills">
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <IdentitiChip key={skill.id}>
                {skill.skillName}
                {" · "}
                {SKILL_LEVEL_LABEL[skill.verificationLevel]}
              </IdentitiChip>
            ))}
          </div>
        </IdentitiSection>
      ) : isOwner ? (
        <IdentitiSection eyebrow="Expertise" title="Skills">
          <p className="text-sm text-muted-foreground">
            No skills listed yet.{" "}
            <Link href="/passport?section=skills" className="font-medium text-brand hover:underline">
              Add skills to your passport
            </Link>
          </p>
        </IdentitiSection>
      ) : null}

      {services.length > 0 ? (
        <IdentitiSection eyebrow="What they offer" title="Professional services">
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.id} className="border border-border p-4">
                <p className="font-semibold">{service.name}</p>
                {service.description ? <p className="mt-1 text-sm text-text-secondary">{service.description}</p> : null}
                <p className="mt-2 text-xs text-muted-foreground">
                  {[service.availabilityLabel, service.locations.join(", ")].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      <IdentitiSection eyebrow="Work" title="Featured projects">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No opted-in projects are public yet.{" "}
            <Link href="/projects" className="font-medium text-brand hover:underline">
              Browse projects
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`} className="group overflow-hidden border border-border">
                <PhotoFrame src={project.coverImageUrl} alt="" className="h-48" />
                <div className="p-4">
                  {project.type ? <IdentitiChip>{project.type}</IdentitiChip> : null}
                  <h3 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-brand">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{[project.city, project.valueLabel].filter(Boolean).join(" · ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </IdentitiSection>

      {experiences.length > 0 ? (
        <IdentitiSection eyebrow="Career" title="Work history">
          <ol className="relative space-y-5 border-l border-border pl-5">
            {experiences.map((item) => (
              <li key={item.id}>
                <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-brand" aria-hidden />
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-text-secondary">{item.organisationNameText}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[item.startDate, item.endDate ?? "Present"].filter(Boolean).join(" — ")}
                  {item.source === "organisation_verified" ? " · Employer confirmed" : " · Self declared"}
                </p>
              </li>
            ))}
          </ol>
        </IdentitiSection>
      ) : null}

      {certifications.length > 0 ? (
        <IdentitiSection eyebrow="Evidence" title="Credentials">
          <div className="grid gap-3 md:grid-cols-2">
            {certifications.map((item) => (
              <div key={item.id} className="border border-border p-4">
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{[item.issuer, item.expiryDate ? `Valid through ${item.expiryDate}` : null].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {education.length > 0 ? (
        <IdentitiSection title="Education and training">
          <div className="grid gap-3 md:grid-cols-2">
            {education.map((item) => (
              <div key={item.id} className="border border-border p-4">
                <p className="font-semibold">{item.institution}</p>
                <p className="text-sm text-muted-foreground">{[item.qualification, item.course, item.fieldOfStudy].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {recommendations.length > 0 || (signedIn && !isOwner) ? (
        <IdentitiSection title="Peer endorsements">
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.id} className="border-l-2 border-l-brand bg-surface-muted px-4 py-4">
                <p className="type-micro text-brand">{item.relationship ?? "Peer"}</p>
                <p className="mt-2 text-sm leading-7 text-text-secondary">{item.body}</p>
              </div>
            ))}
            {signedIn && !isOwner ? <RecommendForm toProfileId={profile.id} /> : null}
          </div>
        </IdentitiSection>
      ) : null}

      <IdentitiSection eyebrow="Activity" title="Recent posts">
        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No public posts yet. When this person publishes an update, it appears here from the live feed.
          </p>
        ) : (
          <ul className="divide-y divide-border border border-border">
            {posts.slice(0, 6).map((post) => (
              <li key={post.id} className="p-4">
                <p className="text-sm leading-6 text-text-secondary">{post.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </IdentitiSection>
    </div>
  );
}
