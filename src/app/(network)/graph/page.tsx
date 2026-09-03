import { redirect } from "next/navigation";
import { WorkGraphView } from "@/features/graph/work-graph";
import { getAuthContext } from "@/lib/data/query";
import { getWorkGraph } from "@/lib/data/workspace";

export default async function GraphPage() {
  const session = await getAuthContext();
  if (!session.userId) redirect("/auth/sign-in?next=/graph");
  const graph = await getWorkGraph(session.userId);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Work graph</h1>
      <WorkGraphView
        workedWith={graph.workedWith}
        colleagues={graph.colleagues}
        organisations={graph.organisations}
        projects={graph.projects}
      />
    </div>
  );
}
