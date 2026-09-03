import { PersonCard } from "@/components/cards/entity-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { getOrganisationById, listConnections, listOrgPeople, listPublicProfiles } from "@/lib/data/network";

export async function NetworkView() {
  const session = await getAuthContext();
  if (!session.userId) {
    return (
      <EmptyState
        title="Sign in to see your network"
        body="Connections, shared organisations and people you have worked with are private to your account."
      />
    );
  }
  const connections = await listConnections(session.userId);
  const org = session.profile?.currentOrganisationId
    ? (await getOrganisationById(session.profile.currentOrganisationId)).data
    : null;
  const colleagues = org ? await listOrgPeople(org.id) : { data: [] };
  const sameOrg = org
    ? (await listPublicProfiles({ organisationId: org.id })).data.filter((p) => p.id !== session.userId)
    : [];
  const colleagueIds = new Set([...colleagues.data.map((p) => p.id), ...sameOrg.map((p) => p.id)]);
  const uniqueColleagues = [...colleagues.data, ...sameOrg.filter((p) => !colleagues.data.some((c) => c.id === p.id))].filter(
    (p) => p.id !== session.userId,
  );
  const connectionIds = new Set(connections.data.map((p) => p.id));
  const discover = (await listPublicProfiles()).data
    .filter((p) => p.id !== session.userId && !connectionIds.has(p.id) && !colleagueIds.has(p.id))
    .slice(0, 8);

  return (
    <Tabs defaultValue="connections">
      <TabsList>
        <TabsTrigger value="connections">Connections</TabsTrigger>
        <TabsTrigger value="colleagues">Shared organisation</TabsTrigger>
        <TabsTrigger value="discover">Discover</TabsTrigger>
      </TabsList>
      <TabsContent value="connections">
        {connections.data.length === 0 ? (
          <EmptyState title="No connections yet" body="When someone accepts, they will appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {connections.data.map((p) => (
              <PersonCard key={p.id} profile={p} connectionState="connected" />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="colleagues">
        {!org ? (
          <EmptyState
            title="No shared organisation yet"
            body="When your current organisation is set, people who appear on it will list here."
          />
        ) : uniqueColleagues.length === 0 ? (
          <EmptyState
            title={`No public colleagues at ${org.name}`}
            body="Only people who opted to appear on this organisation are shown."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {uniqueColleagues.map((p) => (
              <PersonCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="discover">
        {discover.length === 0 ? (
          <EmptyState
            title="No more professionals to discover"
            body="The public directory is the full list when the network is small."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {discover.map((p) => (
              <PersonCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
