import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar } from "@/components/identity/visuals";
import { PhotoFrame } from "@/components/identity/media-photo";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import { IdentitiNetworkBar } from "@/features/identiti/identiti-network-bar";
import { IdentitiChip, IdentitiSection } from "@/features/identiti/identiti-chrome";
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
  return (
    <div className="space-y-6 pb-14">
      <section className="overflow-hidden rounded-[28px] border border-[#e2e5ef] bg-white shadow-[0_18px_60px_rgba(20,28,73,.09)]">
        <div className="bg-[#111a42] p-8 text-white md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Professional</p>
          <div className="mt-4 flex flex-wrap items-start gap-4">
            <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={80} src={profile.avatarPath} />
            <div>
              <div className="flex flex-wrap gap-2">
                {profile.identityVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="size-3" /> Identity verified
                  </span>
                ) : null}
                {profile.employmentVerified ? <IdentitiChip>Employment verified</IdentitiChip> : null}
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-tight">{profile.fullName}</h1>
              <p className="mt-2 text-white/80">{profile.headline}</p>
              <p className="mt-1 text-sm text-white/60">
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
              {profile.industriesServed.length > 0 ? (
                <p className="mt-2 text-sm text-white/70">Industries: {profile.industriesServed.join(", ")}</p>
              ) : null}
              {employer ? (
                <p className="mt-2 text-sm">
                  Works with{" "}
                  <Link href={brandPublicHref(employer.passportKind, employer.slug)} className="underline">
                    {employer.name}
                  </Link>
                </p>
              ) : null}
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-white/90">{profile.about}</p>
          {profile.languages.length > 0 ? (
            <p className="mt-3 text-sm text-white/70">Languages: {profile.languages.join(", ")}</p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="secondary" className="rounded-xl font-bold">
              <Link href={`/passport/${profile.handle}`}>Career passport</Link>
            </Button>
            {isOwner ? (
              <Button asChild className="rounded-xl bg-white font-bold text-[#111a42] hover:bg-white/90">
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
        <div className="grid grid-cols-2 gap-y-5 px-5 py-5 sm:grid-cols-3 sm:px-7">
          <Stat value={String(verifiedProjects.length || projects.length)} label="Named projects" />
          <Stat value={experiences.filter((item) => item.source === "organisation_verified").length ? "Employer confirmed" : experiences.length ? "Self declared" : "—"} label="Work history" />
          <Stat value={certifications.length ? String(certifications.length) : "—"} label="Claimed credentials" />
        </div>
      </section>

      {skills.length > 0 ? (
        <IdentitiSection eyebrow="Capabilities" title="Skills">
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
        <IdentitiSection eyebrow="Capabilities" title="Skills">
          <p className="text-sm text-[#747a95]">
            No skills listed yet.{" "}
            <Link href="/passport?section=skills" className="font-semibold text-[#2437d4]">
              Add skills to your passport
            </Link>
          </p>
        </IdentitiSection>
      ) : null}

      {services.length > 0 ? (
        <IdentitiSection eyebrow="What they offer" title="Services">
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
              <div key={service.id} className="rounded-xl border border-[#eceef4] p-4">
                <p className="font-bold text-[#111a42]">{service.name}</p>
                {service.description ? <p className="mt-1 text-sm text-[#747a95]">{service.description}</p> : null}
                <p className="mt-2 text-xs text-[#7a7f99]">
                  {[service.availabilityLabel, service.locations.join(", ")].filter(Boolean).join(" · ")}
                </p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      <IdentitiSection eyebrow="Proof of work" title="Featured work">
        {projects.length === 0 ? (
          <p className="text-sm text-[#747a95]">
            No opted-in projects are public yet.{" "}
            <Link href="/projects" className="font-semibold text-[#2437d4]">
              Browse projects
            </Link>
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`} className="overflow-hidden rounded-2xl border border-[#e4e6ef]">
                <PhotoFrame src={project.coverImageUrl} alt="" className="h-40" />
                <div className="p-5">
                  {project.type ? <IdentitiChip>{project.type}</IdentitiChip> : null}
                  <h3 className="mt-2 text-lg font-bold text-[#111a42]">{project.name}</h3>
                  <p className="text-sm text-[#747a95]">{[project.city, project.valueLabel].filter(Boolean).join(" · ")}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </IdentitiSection>

      {experiences.length > 0 ? (
        <IdentitiSection eyebrow="Career passport" title="Selected outcomes">
          <ol className="space-y-4">
            {experiences.map((item) => (
              <li key={item.id} className="rounded-xl border border-[#eceef4] p-4">
                <p className="font-bold text-[#111a42]">{item.title}</p>
                <p className="text-sm text-[#747a95]">{item.organisationNameText}</p>
                <p className="mt-1 text-xs text-[#7a7f99]">
                  {[item.startDate, item.endDate ?? "Present"].filter(Boolean).join(" — ")}
                  {item.source === "organisation_verified" ? " · Employer confirmed" : " · Self declared"}
                </p>
              </li>
            ))}
          </ol>
        </IdentitiSection>
      ) : null}

      {certifications.length > 0 ? (
        <IdentitiSection title="Credentials">
          <div className="grid gap-3 md:grid-cols-2">
            {certifications.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#eceef4] p-4">
                <p className="font-bold text-[#111a42]">{item.name}</p>
                <p className="text-sm text-[#747a95]">{[item.issuer, item.expiryDate ? `Valid through ${item.expiryDate}` : null].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {education.length > 0 ? (
        <IdentitiSection title="Education and training">
          <div className="grid gap-3 md:grid-cols-2">
            {education.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#eceef4] p-4">
                <p className="font-bold text-[#111a42]">{item.institution}</p>
                <p className="text-sm text-[#747a95]">{[item.qualification, item.course, item.fieldOfStudy].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      {recommendations.length > 0 ? (
        <IdentitiSection title="Peer endorsements">
          <div className="space-y-3">
            {recommendations.map((item) => (
              <div key={item.id} className="rounded-xl bg-[#f7f8fb] p-4">
                <p className="text-xs font-semibold text-[#616ee7]">{item.relationship ?? "Peer"}</p>
                <p className="mt-2 text-sm leading-6 text-[#303757]">{item.body}</p>
              </div>
            ))}
          </div>
        </IdentitiSection>
      ) : null}

      <IdentitiSection eyebrow="Activity" title="Recent posts">
        {posts.length === 0 ? (
          <p className="text-sm text-[#747a95]">
            No public posts yet. When this person publishes an update, it appears here from the live feed — not as
            manufactured activity.
          </p>
        ) : (
          <ul className="space-y-3">
            {posts.slice(0, 6).map((post) => (
              <li key={post.id} className="rounded-xl border border-[#eceef4] p-4">
                <p className="text-sm leading-6 text-[#303757]">{post.body}</p>
                <p className="mt-2 text-xs text-[#7a7f99]">{new Date(post.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </IdentitiSection>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xl font-extrabold tracking-tight text-[#111a42]">{value}</div>
      <div className="mt-1 text-xs leading-5 text-[#7a7f99]">{label}</div>
    </div>
  );
}
