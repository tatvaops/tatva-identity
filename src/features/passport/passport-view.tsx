import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PassportStrength } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { calculatePassportStrength } from "@/lib/domain/passport-strength";
import type { PublicProfile, Experience, ProfileSkill, ProfileCertification, NetworkProject, RecommendationRow } from "@/lib/types/identity";

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
      <Tabs defaultValue={section}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reputation">Reputation</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="p-5">
            <PassportStrength completeness={strength.completeness} components={strength.components} />
          </Card>
        </TabsContent>
        <TabsContent value="experience">
          {experiences.length === 0 ? (
            <EmptyState title="No experience yet" body="Add roles from your public profile editor." />
          ) : (
            <Card className="p-5 text-sm space-y-2">
              {experiences.map((e) => (
                <p key={e.id}>
                  {e.title} · {e.source.replace("_", " ")}
                </p>
              ))}
            </Card>
          )}
        </TabsContent>
        <TabsContent value="projects">
          {projects.length === 0 ? (
            <EmptyState title="No projects yet" body="Opted-in contributions appear here." />
          ) : (
            <Card className="p-5 text-sm">
              {projects.map((p) => (
                <p key={p.id}>{p.name}</p>
              ))}
            </Card>
          )}
        </TabsContent>
        <TabsContent value="skills">
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
        </TabsContent>
        <TabsContent value="certifications">
          {certifications.length === 0 ? (
            <EmptyState title="No public credentials yet" body="Choose which credentials are visible on the public passport." />
          ) : (
            <Card className="p-5 text-sm">
              {certifications.map((c) => (
                <p key={c.id}>{c.name}</p>
              ))}
            </Card>
          )}
        </TabsContent>
        <TabsContent value="documents">
          <Card className="p-5 text-sm text-muted-foreground">
            KYC documents stay in private storage. Public profile only shows verification state.
          </Card>
        </TabsContent>
        <TabsContent value="reputation">
          <Card>
            <CardHeader>
              <CardTitle>Reputation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Reliability charts will use derived Vertex summaries, never raw attendance. Nothing to plot until that
              feed exists.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="availability">
          <Card className="p-5 text-sm">Status: {profile.availabilityStatus.replaceAll("_", " ")}</Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
