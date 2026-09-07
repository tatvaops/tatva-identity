import { redirect } from "next/navigation";
import { CompanyCard, GigCard, JobCard, PersonCard, ProjectCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAuthContext } from "@/lib/data/query";
import { hydrateSavedGigs, hydrateSavedJobs, hydrateSavedOrgs, hydrateSavedPeople, hydrateSavedProjects, listSavedItems } from "@/lib/data/workspace";

export default async function SavedPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/saved");
  const saved = await listSavedItems(session.userId);
  const [jobs, gigs, orgs, people, projects] = await Promise.all([
    hydrateSavedJobs(saved.data),
    hydrateSavedGigs(saved.data),
    hydrateSavedOrgs(saved.data),
    hydrateSavedPeople(saved.data),
    hydrateSavedProjects(saved.data),
  ]);
  const empty = jobs.length === 0 && gigs.length === 0 && orgs.length === 0 && people.length === 0 && projects.length === 0;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Saved</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          People, organisations, projects, jobs and gigs you bookmark stay on this account.
        </p>
      </div>
      {empty ? (
        <EmptyState
          title="Nothing saved yet"
          body="People, brands, jobs, gigs and projects you save are stored on your account and listed here."
        />
      ) : (
        <Tabs defaultValue={people.length ? "people" : orgs.length ? "organisations" : projects.length ? "projects" : jobs.length ? "jobs" : "gigs"}>
          <TabsList>
            <TabsTrigger value="people">People ({people.length})</TabsTrigger>
            <TabsTrigger value="organisations">Organisations ({orgs.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
            <TabsTrigger value="gigs">Gigs ({gigs.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="people">
            {people.length === 0 ? (
              <EmptyState title="No saved people" body="Save a professional passport to keep it here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {people.map((person) => (
                  <PersonCard key={person.id} profile={person} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="organisations">
            {orgs.length === 0 ? (
              <EmptyState title="No saved organisations" body="Save a company or brand passport to keep it here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {orgs.map((org) => (
                  <CompanyCard key={org.id} org={org} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="projects">
            {projects.length === 0 ? (
              <EmptyState title="No saved projects" body="Save a project to keep the evidence trail here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="jobs">
            {jobs.length === 0 ? (
              <EmptyState title="No saved jobs" body="Save a role while you compare opportunities." />
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="gigs">
            {gigs.length === 0 ? (
              <EmptyState title="No saved gigs" body="Save a shift or site gig to return to it later." />
            ) : (
              <div className="space-y-3">
                {gigs.map((gig) => (
                  <GigCard key={gig.id} gig={gig} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
