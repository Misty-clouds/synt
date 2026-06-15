'use client';

import type { GraphEdge, GraphNode } from '@synt/shared';
import {
  Background,
  BackgroundVariant,
  Controls,
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
  forceX,
  forceY,
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
    .force('charge', forceManyBody().strength(-520))
    .force(
      'link',
      forceLink<LNode, SimulationLinkDatum<LNode>>(links)
        .id((d) => d.id)
        .distance(135)
        .strength(0.6),
    )
    .force('center', forceCenter(0, 0))
    // Gravity keeps even disconnected nodes near the cluster so fitView stays framed.
    .force('x', forceX(0).strength(0.09))
    .force('y', forceY(0).strength(0.09))
    .force('collide', forceCollide(78))
    .stop()
    .tick(400);

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

  // Keep the whole graph framed and readable as it self-assembles. Re-fit shortly after
  // the last node lands so the final layout is centered and legible (not zoomed out).
  useEffect(() => {
    const t1 = setTimeout(() => fitView({ padding: 0.18, duration: 450, maxZoom: 1.6 }), 80);
    const t2 = setTimeout(() => fitView({ padding: 0.18, duration: 450, maxZoom: 1.6 }), 700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
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
      fitViewOptions={{ padding: 0.18, maxZoom: 1.6 }}
      minZoom={0.4}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      nodesConnectable={false}
      edgesFocusable={false}
      className="bg-app-surface"
    >
      <Background variant={BackgroundVariant.Dots} gap={26} size={1} color="#1f1f1f" />
      <Controls position="top-left" showInteractive={false} className="!shadow-lg" />
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
