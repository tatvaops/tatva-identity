import Link from "next/link";
import { CompanyCard, PersonCard } from "@/components/cards/entity-cards";
import { VerificationBadge } from "@/components/identity/verification";
import { CoverBand } from "@/components/identity/visuals";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/states/empty-state";
import { PostCard } from "@/features/feed/feed-ui";
import type { NetworkProject, Organisation, Post, PublicProfile } from "@/lib/types/identity";

export function ProjectProfileView({
  project,
  client,
  main,
  contributors,
  companies,
  updates,
}: {
  project: NetworkProject;
  client: Organisation | null;
  main: Organisation | null;
  contributors: PublicProfile[];
  companies: Organisation[];
  updates: Post[];
}) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CoverBand tone="tower" className="h-40" />
        <div className="p-5">
          <div className="flex flex-wrap gap-2">
            {project.verified && (
              <VerificationBadge
                flag={{
                  kind: "project",
                  state: "verified",
                  label: "Project verified",
                  explanation: "Scope, companies and opted-in contributors are evidenced.",
                }}
              />
            )}
            <Badge>{project.status.replace("_", " ")}</Badge>
            {project.type && <Badge variant="outline">{project.type}</Badge>}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {[project.locality, project.city].filter(Boolean).join(", ")}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6">{project.summary}</p>
          <p className="mt-3 text-sm">
            {client && (
              <>
                Client:{" "}
                <Link className="text-primary" href={`/org/${client.slug}`}>
                  {client.name}
                </Link>
              </>
            )}
            {main && (
              <>
                {" · "}Main contractor:{" "}
                <Link className="text-primary" href={`/org/${main.slug}`}>
                  {main.name}
                </Link>
              </>
            )}
          </p>
        </div>
      </Card>
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="updates">Updates</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="p-4 text-sm">{project.summary ?? "No overview yet."}</Card>
        </TabsContent>
        <TabsContent value="updates" className="space-y-3">
          {updates.length === 0 ? (
            <EmptyState title="No updates yet" body="Project posts will appear here." />
          ) : (
            updates.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </TabsContent>
        <TabsContent value="team" className="grid gap-3 sm:grid-cols-2">
          {contributors.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title="No public contributors yet" body="People who opt in will appear on this project." />
            </div>
          )}
          {contributors.map((p) => (
            <PersonCard key={p.id} profile={p} />
          ))}
        </TabsContent>
        <TabsContent value="companies" className="grid gap-3 sm:grid-cols-2">
          {companies.length === 0 && (
            <div className="sm:col-span-2">
              <EmptyState title="No companies linked yet" body="Clients, contractors and vendors will list here." />
            </div>
          )}
          {companies.map((o) => (
            <CompanyCard key={o.id} org={o} />
          ))}
        </TabsContent>
        <TabsContent value="gallery">
          <EmptyState title="No gallery yet" body="Project photos appear here when contributors opt them in. Sensitive site data stays private." />
        </TabsContent>
        <TabsContent value="milestones">
          <EmptyState title="No milestones yet" body="Verified project milestones will list here when recorded." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
