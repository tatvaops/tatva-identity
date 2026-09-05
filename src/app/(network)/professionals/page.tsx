import { IdentitiPeopleDirectory } from "@/features/identiti/people-directory";
import { listProfessionals } from "@/lib/data/identiti";
import { QueryNotice } from "@/components/states/empty-state";

export default async function ProfessionalsPage() {
  const people = await listProfessionals();
  return (
    <>
      <QueryNotice configured={people.meta.configured} error={people.meta.error} />
      <IdentitiPeopleDirectory
        title="Professionals"
        body="Executives, designers and delivery leads. Judge them by named projects, not a slogan."
        people={people.data}
      />
    </>
  );
}
