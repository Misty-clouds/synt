import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { entityId, extractEntities } from '@synt/agent';
import { getScenario } from '@synt/scenarios';
import type { TraceEvent } from '@synt/shared';
import type { HostedModel, SplunkClient } from '@synt/splunk';
import { HOSTED_MODEL, SPLUNK_CLIENT } from '../splunk/splunk.module';
import { SseGateway } from '../sse/sse.gateway';
import { STORE } from '../store/store.module';
import type { Store } from '../store/store';

@Injectable()
export class NlService {
  constructor(
    @Inject(STORE) private readonly store: Store,
    @Inject(SPLUNK_CLIENT) private readonly splunk: SplunkClient,
    @Inject(HOSTED_MODEL) private readonly model: HostedModel,
    private readonly sse: SseGateway,
  ) {}

  /** Interpret a plain-English analyst directive and re-steer the live investigation. */
  async command(investigationId: string, text: string): Promise<{ spl: string; count: number; answer: string }> {
    const inv = await this.store.getInvestigation(investigationId);
    if (!inv) throw new NotFoundException(`Investigation ${investigationId} not found`);
    const scenario = getScenario(inv.signal.scenarioId);
    const tag = `[scenario:${inv.signal.scenarioId}]`;

    this.emit(investigationId, 'pivot', `Analyst directive: "${text}"`);

    const spl = await this.model.nlToSpl(`${tag} ${text}`, scenario.indexes);
    this.emit(investigationId, 'query_running', `Re-querying per analyst directive.`, { spl });

    const rows = await this.splunk.search(spl);
    this.emit(investigationId, 'evidence_found', `Directive query returned ${rows.length} events.`, {
      spl,
      count: rows.length,
      sample: rows.slice(0, 3),
    });

    // Surface any newly relevant entities into the graph.
    const known = new Set(inv.graph.nodes.map((n) => n.id));
    const primary = inv.signal.entities[0];
    for (const e of extractEntities(rows)) {
      const id = entityId(e);
      if (!known.has(id)) {
        this.emit(investigationId, 'entity_discovered', `Discovered ${e.type}: ${e.value}`, {
          node: { id, type: e.type, label: e.value, suspicious: true },
        });
      }
      if (primary && id !== entityId(primary)) {
        this.emit(investigationId, 'edge_discovered', `${primary.value} → ${e.value}`, {
          edge: { id: `${entityId(primary)}->${id}:nl`, from: entityId(primary), to: id, relation: 'related' },
        });
      }
    }

    const answer = await this.model.complete(`${tag} ${text}`);
    this.emit(investigationId, 'observe', answer);

    return { spl, count: rows.length, answer };
  }

  private emit(investigationId: string, type: TraceEvent['type'], message: string, data?: Record<string, unknown>): void {
    const ev: TraceEvent = {
      id: `${investigationId}_n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      investigationId,
      ts: new Date().toISOString(),
      type,
      message,
      data,
    };
    void this.store.appendTrace(ev);
    this.sse.publish(ev);
  }
}
