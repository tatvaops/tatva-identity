"use client";

import { useMemo } from "react";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { NetworkProject, Organisation, PublicProfile } from "@/lib/types/identity";

export function WorkGraphCanvas({
  self,
  workedWith,
  organisations,
  projects,
}: {
  self: PublicProfile;
  workedWith: PublicProfile[];
  organisations: Organisation[];
  projects: NetworkProject[];
}) {
  const { nodes, edges } = useMemo(() => {
    const nextNodes: Node[] = [
      {
        id: self.id,
        position: { x: 280, y: 180 },
        data: { label: self.fullName },
        style: { borderRadius: 12, padding: 8, fontSize: 12 },
      },
    ];
    const nextEdges: Edge[] = [];
    workedWith.forEach((person, index) => {
      nextNodes.push({
        id: person.id,
        position: { x: 40 + (index % 3) * 180, y: 20 + Math.floor(index / 3) * 80 },
        data: { label: person.fullName },
        style: { borderRadius: 12, padding: 8, fontSize: 12 },
      });
      nextEdges.push({ id: `ww-${person.id}`, source: self.id, target: person.id, label: "worked with" });
    });
    organisations.forEach((org, index) => {
      nextNodes.push({
        id: org.id,
        position: { x: 40 + (index % 3) * 180, y: 320 + Math.floor(index / 3) * 80 },
        data: { label: org.name },
        style: { borderRadius: 12, padding: 8, fontSize: 12, background: "#eef2ff" },
      });
      nextEdges.push({ id: `org-${org.id}`, source: self.id, target: org.id, label: "organisation" });
    });
    projects.forEach((project, index) => {
      nextNodes.push({
        id: project.id,
        position: { x: 560, y: 40 + index * 80 },
        data: { label: project.name },
        style: { borderRadius: 12, padding: 8, fontSize: 12, background: "#ecfdf5" },
      });
      nextEdges.push({ id: `proj-${project.id}`, source: self.id, target: project.id, label: "project" });
    });
    return { nodes: nextNodes, edges: nextEdges };
  }, [self, workedWith, organisations, projects]);

  return (
    <div className="h-[480px] overflow-hidden rounded-2xl border border-border bg-white">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
