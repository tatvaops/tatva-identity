import { PersonCard } from "@/components/cards/entity-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/states/empty-state";
import { getAuthContext } from "@/lib/data/query";
import { listConnections, listPublicProfiles } from "@/lib/data/network";

export async function NetworkView() {
  const session = await getAuthContext();
  if (!session.userId) {
    return (
      <EmptyState
        title="Sign in to see your network"
        body="Connections, followers and people you have worked with are private to your account."
      />
    );
  }
  const connections = await listConnections(session.userId);
  const suggestions = await listPublicProfiles();
  const others = suggestions.data.filter((p) => p.id !== session.userId);

  return (
    <Tabs defaultValue="connections">
      <TabsList>
        <TabsTrigger value="connections">Connections</TabsTrigger>
        <TabsTrigger value="suggested">People you may know</TabsTrigger>
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
      <TabsContent value="suggested">
        {others.length === 0 ? (
          <EmptyState title="No suggestions yet" body="Suggestions will use shared projects and organisations later." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.slice(0, 12).map((p) => (
              <PersonCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
