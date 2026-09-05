import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InitialsAvatar } from "@/components/identity/visuals";
import { PhotoFrame } from "@/components/identity/media-photo";
import { hueFromId, initialsFromName } from "@/lib/domain/passport-strength";
import { brandPublicHref } from "@/lib/domain/identiti-routes";
import type { PublicProfile } from "@/lib/types/identity";
import type { IdentitiBrand, IdentitiProject } from "@/lib/data/identiti";

export function ProfessionalView({
  profile,
  projects,
  employer,
}: {
  profile: PublicProfile;
  projects: IdentitiProject[];
  employer: IdentitiBrand | null;
}) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-[#0b1f3a] p-8 text-white md:p-10">
        <p className="text-xs uppercase tracking-[0.2em] text-white/70">Professional</p>
        <div className="mt-4 flex flex-wrap items-start gap-4">
          <InitialsAvatar initials={initialsFromName(profile.fullName)} hue={hueFromId(profile.id)} size={72} src={profile.avatarPath} />
          <div>
            <div className="flex flex-wrap gap-2">
              {profile.identityVerified ? <Badge variant="verify">Identity verified</Badge> : null}
              {profile.employmentVerified ? <Badge variant="outline" className="border-white/30 text-white">Employment verified</Badge> : null}
            </div>
            <h1 className="mt-3 text-4xl font-semibold">{profile.fullName}</h1>
            <p className="mt-2 text-white/80">{profile.headline}</p>
            <p className="mt-1 text-sm text-white/60">
              {profile.city}
              {profile.preferredRoles[0] ? ` · ${profile.preferredRoles[0]}` : ""}
            </p>
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
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link href={`/passport/${profile.handle}`}>Open passport</Link>
          </Button>
          <Button asChild>
            <Link href={`/messages?to=${profile.handle}`}>Request an introduction</Link>
          </Button>
        </div>
      </section>
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Proof of work</p>
        <h2 className="mt-1 text-2xl font-semibold">Projects this person is named on</h2>
        {projects.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No opted-in projects are public yet. Named work appears here after the person is linked on a
            verified project record.{" "}
            <Link href="/projects" className="font-medium text-primary underline underline-offset-2">
              Browse projects
            </Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.slug}`}>
                <Card className="overflow-hidden">
                  <PhotoFrame src={project.coverImageUrl} alt="" className="h-40" />
                  <div className="p-5">
                    <p className="text-xs text-muted-foreground">{project.type}</p>
                    <h3 className="mt-1 text-lg font-semibold">{project.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.city}
                      {project.valueLabel ? ` · ${project.valueLabel}` : ""}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
