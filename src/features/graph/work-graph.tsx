import Link from "next/link";
import { PersonCard, ProjectCard, CompanyCard } from "@/components/cards/entity-cards";
import { EmptyState } from "@/components/states/empty-state";
import { Card } from "@/components/ui/card";
import { WorkGraphCanvas } from "@/features/graph/work-graph-canvas";
import type { NetworkProject, Organisation, PublicProfile } from "@/lib/types/identity";

export function WorkGraphView({
  self,
  workedWith,
  colleagues,
  organisations,
  projects,
}: {
  self?: PublicProfile | null;
  workedWith: PublicProfile[];
  colleagues: PublicProfile[];
  organisations: Organisation[];
  projects: NetworkProject[];
}) {
  const empty = workedWith.length + colleagues.length + organisations.length + projects.length === 0;
  if (empty) {
    return (
      <EmptyState
        title="No work graph yet"
        body="People, organisations and projects you are publicly linked to will appear here. Nothing is invented."
      />
    );
  }
  const canvasPeople = [...workedWith];
  for (const person of colleagues) {
    if (!canvasPeople.some((row) => row.id === person.id)) canvasPeople.push(person);
  }
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This graph is built from opted-in project contributors and public organisation membership. It is not a popularity score.
      </p>
      {self ? (
        <WorkGraphCanvas
          self={self}
          workedWith={canvasPeople}
          organisations={organisations}
          projects={projects}
        />
      ) : null}
      {workedWith.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Worked with</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workedWith.map((person) => (
              <PersonCard key={person.id} profile={person} />
            ))}
          </div>
        </section>
      )}
      {colleagues.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Shared organisation</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colleagues.map((person) => (
              <PersonCard key={person.id} profile={person} />
            ))}
          </div>
        </section>
      )}
      {organisations.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Organisations</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {organisations.map((org) => (
              <CompanyCard key={org.id} org={org} />
            ))}
          </div>
        </section>
      )}
      {projects.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold">Projects</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </section>
      )}
      <Card className="p-4 text-sm text-muted-foreground">
        Relationship map: person ↔ project ↔ organisation. Open any card for the public record.{" "}
        <Link className="text-primary hover:underline" href="/network">
          Back to network
        </Link>
      </Card>
    </div>
  );
}
