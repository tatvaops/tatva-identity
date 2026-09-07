import { IdentitiPeopleDirectory } from "@/features/identiti/people-directory";
import { listProfessionals } from "@/lib/data/identiti";
import { QueryNotice } from "@/components/states/empty-state";
import { isGigOccupation } from "@/lib/domain/identiti-routes";

export default async function ProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string; availability?: string; skill?: string }>;
}) {
  const filters = await searchParams;
  const people = await listProfessionals({
    query: filters.q,
    city: filters.city,
    availability: filters.availability,
    skill: filters.skill,
  });
  return (
    <>
      <QueryNotice configured={people.meta.configured} error={people.meta.error} />
      <IdentitiPeopleDirectory
        title="Professionals"
        body="Executives, designers and delivery leads. Judge them by named projects, not a slogan."
        people={people.data.filter((person) => !isGigOccupation(person.occupationMode))}
        query={filters.q}
        city={filters.city}
        availability={filters.availability}
        skill={filters.skill}
      />
    </>
  );
}
