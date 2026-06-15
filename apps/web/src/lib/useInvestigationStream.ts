'use client';

import type { GraphEdge, GraphNode, Hypothesis, TraceEvent } from '@synt/shared';
import { useEffect, useRef, useState } from 'react';
import { api } from './api';

export interface StreamState {
  events: TraceEvent[];
  nodes: GraphNode[];
  edges: GraphEdge[];
  hypotheses: Hypothesis[];
  complete: boolean;
  /** id of the most recently added node, for focus-glow in the graph. */
  focusNodeId?: string;
}

const EMPTY: StreamState = { events: [], nodes: [], edges: [], hypotheses: [], complete: false };

export function useInvestigationStream(id: string): StreamState {
  const [state, setState] = useState<StreamState>(EMPTY);
  const nodeMap = useRef(new Map<string, GraphNode>());
  const edgeMap = useRef(new Map<string, GraphEdge>());

  useEffect(() => {
    nodeMap.current = new Map();
    edgeMap.current = new Map();
    setState(EMPTY);

    const es = new EventSource(api.streamUrl(id));

    es.onmessage = (msg) => {
      let ev: TraceEvent;
      try {
        ev = JSON.parse(msg.data) as TraceEvent;
      } catch {
        return;
      }

      setState((prev) => {
        let { hypotheses, complete, focusNodeId } = prev;

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
              nodeMap.current.set(node.id, node);
              focusNodeId = node.id;
            }
            break;
          }
          case 'edge_discovered': {
            const edge = ev.data?.edge as GraphEdge | undefined;
            if (edge) edgeMap.current.set(edge.id, edge);
            break;
          }
          case 'investigation_complete':
            complete = true;
            break;
        }

        return {
          events: [...prev.events, ev],
          nodes: [...nodeMap.current.values()],
          edges: [...edgeMap.current.values()],
          hypotheses,
          complete,
          focusNodeId,
        };
      });
    };

    es.onerror = () => {
      // The API closes the stream when idle; the browser will retry automatically.
    };

    return () => es.close();
  }, [id]);

  return state;
}
