'use client';

import type { GraphEdge, GraphNode, Hypothesis, TraceEvent, TraceEventType } from '@synt/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';

export interface StreamState {
  events: TraceEvent[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  hypotheses: Hypothesis[];
  complete: boolean;
  /** id of the most recently revealed node, for focus-glow in the graph. */
  focusNodeId?: string;
  /** still revealing buffered events (the agent's reasoning is "thinking"). */
  thinking: boolean;
}

/** Per-event reveal delay (ms) — paces the burst into a believable real-time stream. */
const DELAY: Partial<Record<TraceEventType, number>> = {
  investigation_started: 350,
  observe: 450,
  hypotheses_formed: 750,
  query_running: 600,
  evidence_found: 500,
  hypothesis_confirmed: 700,
  hypothesis_rejected: 700,
  pivot: 750,
  entity_discovered: 160,
  edge_discovered: 150,
  action_executed: 650,
  investigation_complete: 450,
};
const DEFAULT_DELAY = 380;

/** Replay revealed events into graph/hypotheses/complete state. */
function derive(events: TraceEvent[]): Omit<StreamState, 'events' | 'thinking'> {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  let hypotheses: Hypothesis[] = [];
  let complete = false;
  let focusNodeId: string | undefined;

  for (const ev of events) {
    switch (ev.type) {
      case 'hypotheses_formed':
        hypotheses = ((ev.data?.hypotheses as Hypothesis[]) ?? []).slice();
        break;
      case 'hypothesis_confirmed':
      case 'hypothesis_rejected': {
        const hid = ev.data?.hypothesisId as string;
        hypotheses = hypotheses.map((h) =>
          h.id === hid
            ? {
                ...h,
                status: ev.type === 'hypothesis_confirmed' ? 'confirmed' : 'rejected',
                posteriorConfidence: ev.data?.posteriorConfidence as number,
              }
            : h,
        );
        break;
      }
      case 'entity_discovered': {
        const node = ev.data?.node as GraphNode | undefined;
        if (node) {
          nodes.set(node.id, node);
          focusNodeId = node.id;
        }
        break;
      }
      case 'edge_discovered': {
        const edge = ev.data?.edge as GraphEdge | undefined;
        if (edge) edges.set(edge.id, edge);
        break;
      }
      case 'investigation_complete':
        complete = true;
        break;
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()], hypotheses, complete, focusNodeId };
}

export function useInvestigationStream(id: string): StreamState {
  const [revealed, setRevealed] = useState<TraceEvent[]>([]);
  const [thinking, setThinking] = useState(false);
  const pending = useRef<TraceEvent[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pending.current = [];
    setRevealed([]);
    setThinking(false);
    const es = new EventSource(api.streamUrl(id));

    const pump = () => {
      const next = pending.current.shift();
      if (!next) {
        timer.current = null;
        setThinking(false);
        return;
      }
      setThinking(true);
      setRevealed((prev) => [...prev, next]);
      timer.current = setTimeout(pump, DELAY[next.type] ?? DEFAULT_DELAY);
    };

    es.onmessage = (msg) => {
      try {
        pending.current.push(JSON.parse(msg.data) as TraceEvent);
      } catch {
        return;
      }
      if (!timer.current) pump();
    };
    es.onerror = () => {
      /* API closes idle streams; browser auto-retries. */
    };

    return () => {
      es.close();
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };
  }, [id]);

  const derived = useMemo(() => derive(revealed), [revealed]);
  return { events: revealed, thinking, ...derived };
}
