import Link from "next/link";
import { notFound } from "next/navigation";
import { PersonCard } from "@/components/cards/entity-cards";
import { EmptyState, QueryNotice } from "@/components/states/empty-state";
import { getOrganisationBySlug } from "@/lib/data/network";
import { listOrgFollowers } from "@/lib/data/workspace";

export default async function CompanyFollowersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = await getOrganisationBySlug(slug);
  if (org.meta.error) return <QueryNotice configured={org.meta.configured} error={org.meta.error} />;
  if (!org.data) {
    if (!org.meta.configured) return <QueryNotice configured={false} error={null} />;
    notFound();
  }
  const followers = await listOrgFollowers(org.data.id);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Followers · {org.data.name}</h1>
      <Link className="text-sm text-primary hover:underline" href={`/companies/${org.data.slug}`}>
        Back to organisation
      </Link>
      {followers.data.length === 0 ? (
        <EmptyState title="No followers yet" body="People who follow this organisation will appear here." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {followers.data.map((person) => (
            <PersonCard key={person.id} profile={person} />
          ))}
        </div>
      )}
    </div>
  );
}
