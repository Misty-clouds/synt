'use client';

import type { GraphEdge, GraphNode } from '@synt/shared';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { useEffect, useMemo, useRef } from 'react';
import { EntityNode, type EntityNodeData } from './EntityNode';

const nodeTypes: NodeTypes = { entity: EntityNode };

interface Pos {
  x: number;
  y: number;
}
interface LNode extends SimulationNodeDatum {
  id: string;
}

/** Run d3-force headless to get stable positions; reuse prior positions for stability. */
function layout(nodes: GraphNode[], edges: GraphEdge[], prev: Record<string, Pos>): Record<string, Pos> {
  const sim: LNode[] = nodes.map((n, i) => ({
    id: n.id,
    x: prev[n.id]?.x ?? Math.cos(i) * 60,
    y: prev[n.id]?.y ?? Math.sin(i) * 60,
  }));
  const byId = new Map(sim.map((n) => [n.id, n]));
  const links: SimulationLinkDatum<LNode>[] = edges
    .filter((e) => byId.has(e.from) && byId.has(e.to))
    .map((e) => ({ source: e.from, target: e.to }));

  forceSimulation<LNode>(sim)
    .force('charge', forceManyBody().strength(-700))
    .force(
      'link',
      forceLink<LNode, SimulationLinkDatum<LNode>>(links)
        .id((d) => d.id)
        .distance(160)
        .strength(0.5),
    )
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide(72))
    .stop()
    .tick(320);

  return Object.fromEntries(sim.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
}

function Inner({
  nodes,
  edges,
  focusNodeId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusNodeId?: string;
}) {
  const prev = useRef<Record<string, Pos>>({});
  const { fitView } = useReactFlow();

  const positions = useMemo(() => {
    const p = layout(nodes, edges, prev.current);
    prev.current = p;
    return p;
  }, [nodes, edges]);

  const rfNodes: Node<EntityNodeData>[] = nodes.map((n) => ({
    id: n.id,
    type: 'entity',
    position: positions[n.id] ?? { x: 0, y: 0 },
    data: { type: n.type, label: n.label, suspicious: n.suspicious, focus: n.id === focusNodeId },
    draggable: true,
  }));

  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    label: e.relation,
    animated: true,
    style: { stroke: '#3a3a3a', strokeWidth: 1.5 },
    labelStyle: { fill: '#6b7280', fontSize: 9, fontWeight: 500 },
    labelBgStyle: { fill: '#0a0a0a', fillOpacity: 0.85 },
    labelBgPadding: [4, 2] as [number, number],
  }));

  // Keep the whole graph framed as it self-assembles.
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.25, duration: 500, maxZoom: 1.4 }), 60);
    return () => clearTimeout(t);
  }, [nodes.length, edges.length, fitView]);

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        The investigation graph assembles here as entities are discovered…
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.3}
      maxZoom={1.8}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      edgesFocusable={false}
      className="bg-app-surface"
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#1f1f1f" />
    </ReactFlow>
  );
}

export function InvestigationGraph(props: { nodes: GraphNode[]; edges: GraphEdge[]; focusNodeId?: string }) {
  return (
    <ReactFlowProvider>
      <Inner {...props} />
    </ReactFlowProvider>
  );
}
