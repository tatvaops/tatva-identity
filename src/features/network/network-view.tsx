import { PersonCard } from "@/components/cards/entity-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/states/empty-state";
import { PendingConnections } from "@/features/network/pending-connections";
import { OrganisationInvites } from "@/features/network/org-invites";
import { getAuthContext } from "@/lib/data/query";
import { getOrganisationById, listConnections, listOrgPeople, listPublicProfiles } from "@/lib/data/network";
import { discoverPeople, listFollowers, listFollowing, listMyOrganisationInvites, listPendingConnections, listWorkedWith } from "@/lib/data/workspace";

export async function NetworkView({ focus }: { focus?: string }) {
  const session = await getAuthContext();
  if (!session.userId) {
    return (
      <EmptyState
        title="Sign in to see your network"
        body="Connections, shared organisations and people you have worked with are private to your account."
      />
    );
  }
  const [connections, pending, followers, following, workedWith, invites] = await Promise.all([
    listConnections(session.userId),
    listPendingConnections(session.userId),
    listFollowers(session.userId),
    listFollowing(session.userId),
    listWorkedWith(session.userId),
    listMyOrganisationInvites(session.userId),
  ]);
  const org = session.profile?.currentOrganisationId
    ? (await getOrganisationById(session.profile.currentOrganisationId)).data
    : null;
  const colleagues = org ? await listOrgPeople(org.id) : { data: [] };
  const sameOrg = org
    ? (await listPublicProfiles({ organisationId: org.id })).data.filter((p) => p.id !== session.userId)
    : [];
  const uniqueColleagues = [...colleagues.data, ...sameOrg.filter((p) => !colleagues.data.some((c) => c.id === p.id))].filter(
    (p) => p.id !== session.userId,
  );
  const discover = (await discoverPeople(session.userId)).data;
  const defaultTab =
    focus === "followers" || focus === "following" || focus === "pending" || focus === "worked" || focus === "invites"
      ? focus
      : "connections";

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        <TabsTrigger value="connections">Connections</TabsTrigger>
        <TabsTrigger value="pending">Requests</TabsTrigger>
        <TabsTrigger value="invites">Invites</TabsTrigger>
        <TabsTrigger value="followers">Followers</TabsTrigger>
        <TabsTrigger value="following">Following</TabsTrigger>
        <TabsTrigger value="worked">Worked with</TabsTrigger>
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
      <TabsContent value="pending">
        {pending.data.length === 0 ? (
          <EmptyState title="No requests" body="Incoming connection requests will appear here." />
        ) : (
          <PendingConnections items={pending.data} />
        )}
      </TabsContent>
      <TabsContent value="invites">
        {invites.data.length === 0 ? (
          <EmptyState title="No organisation invitations" body="When an organisation invites you, accept or decline it here." />
        ) : (
          <OrganisationInvites items={invites.data} />
        )}
      </TabsContent>
      <TabsContent value="followers">
        {followers.data.length === 0 ? (
          <EmptyState title="No followers yet" body="People who follow you will appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {followers.data.map((p) => (
              <PersonCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="following">
        {following.data.length === 0 ? (
          <EmptyState title="Not following anyone yet" body="People you follow will appear here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {following.data.map((p) => (
              <PersonCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </TabsContent>
      <TabsContent value="worked">
        {workedWith.data.length === 0 ? (
          <EmptyState
            title="No shared project work yet"
            body="People appear here when you both opted into the same public project."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workedWith.data.map((p) => (
              <PersonCard key={p.id} profile={p} />
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
