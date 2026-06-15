'use client';

import type { GraphEdge, GraphNode } from '@synt/shared';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from 'd3-force';
import { useEffect, useRef, useState } from 'react';
import { entityColor } from '../lib/ui';

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}
interface SimLink {
  id: string;
  source: SimNode;
  target: SimNode;
  relation: string;
}

const W = 900;
const H = 620;

export function ForceGraph({
  nodes,
  edges,
  focusNodeId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusNodeId?: string;
}) {
  const simNodes = useRef(new Map<string, SimNode>());
  const sim = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [, force] = useState(0);
  const tick = () => force((n) => n + 1);

  useEffect(() => {
    // Merge incoming nodes into the simulation, preserving existing positions.
    for (const n of nodes) {
      if (!simNodes.current.has(n.id)) {
        simNodes.current.set(n.id, { ...n, x: W / 2 + (Math.random() - 0.5) * 80, y: H / 2 + (Math.random() - 0.5) * 80 });
      } else {
        Object.assign(simNodes.current.get(n.id)!, { suspicious: n.suspicious, label: n.label });
      }
    }
    const list = [...simNodes.current.values()];
    const links: SimLink[] = edges
      .map((e) => {
        const source = simNodes.current.get(e.from);
        const target = simNodes.current.get(e.to);
        return source && target ? { id: e.id, source, target, relation: e.relation } : null;
      })
      .filter((l): l is SimLink => !!l);

    if (!sim.current) {
      sim.current = forceSimulation<SimNode, SimLink>(list)
        .alphaDecay(0.012)
        .velocityDecay(0.3)
        .force('charge', forceManyBody().strength(-520))
        .force('center', forceCenter(W / 2, H / 2))
        .force('x', forceX(W / 2).strength(0.05))
        .force('y', forceY(H / 2).strength(0.07))
        .force('collide', forceCollide(42))
        .on('tick', tick);
    }
    sim.current.nodes(list);
    sim.current.force('link', forceLink<SimNode, SimLink>(links).id((d) => d.id).distance(140).strength(0.45));
    sim.current.alpha(1).restart();
  }, [nodes, edges]);

  useEffect(() => {
    return () => {
      sim.current?.stop();
    };
  }, []);

  const list = [...simNodes.current.values()];
  const links: SimLink[] = edges
    .map((e) => {
      const source = simNodes.current.get(e.from);
      const target = simNodes.current.get(e.to);
      return source && target ? { id: e.id, source, target, relation: e.relation } : null;
    })
    .filter((l): l is SimLink => !!l);

  if (list.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-zinc-600">
        The investigation graph assembles here as entities are discovered…
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {links.map((l) => (
        <g key={l.id}>
          <line
            className="synt-edge-in"
            x1={l.source.x}
            y1={l.source.y}
            x2={l.target.x}
            y2={l.target.y}
            stroke="#2f2f2f"
            strokeWidth={1.5}
          />
          <text
            x={(l.source.x + l.target.x) / 2}
            y={(l.source.y + l.target.y) / 2 - 4}
            textAnchor="middle"
            className="fill-zinc-600"
            fontSize={9}
          >
            {l.relation}
          </text>
        </g>
      ))}

      {list.map((n) => {
        const color = entityColor[n.type] ?? '#9ca3af';
        const isFocus = n.id === focusNodeId;
        return (
          <g key={n.id} className="synt-node-in" transform={`translate(${n.x},${n.y})`}>
            {isFocus && <circle r={26} fill="none" stroke="#0055FF" strokeWidth={2} filter="url(#glow)" />}
            <circle
              r={18}
              fill="#161616"
              stroke={n.suspicious ? '#ef4444' : color}
              strokeWidth={2.5}
              className={n.suspicious ? 'synt-pulse' : undefined}
            />
            <circle r={5} fill={color} />
            <text y={34} textAnchor="middle" className="fill-zinc-300" fontSize={11} fontWeight={500}>
              {n.label.length > 18 ? n.label.slice(0, 17) + '…' : n.label}
            </text>
            <text y={46} textAnchor="middle" className="fill-zinc-600" fontSize={8}>
              {n.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
