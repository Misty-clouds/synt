import { Inject, Injectable, Logger } from '@nestjs/common';
import { runInvestigation } from '@synt/agent';
import { getScenario } from '@synt/scenarios';
import type {
  GraphEdge,
  GraphNode,
  Hypothesis,
  Investigation,
} from '@synt/shared';
import type { HostedModel, SplunkClient } from '@synt/splunk';
import { CaseFileService } from '../casefile/casefile.service';
import { HOSTED_MODEL, SPLUNK_CLIENT } from '../splunk/splunk.module';
import { SseGateway } from '../sse/sse.gateway';
import { STORE } from '../store/store.module';
import type { Store } from '../store/store';

@Injectable()
export class AgentRunner {
  private readonly log = new Logger('AgentRunner');

  constructor(
    @Inject(STORE) private readonly store: Store,
    @Inject(SPLUNK_CLIENT) private readonly splunk: SplunkClient,
    @Inject(HOSTED_MODEL) private readonly model: HostedModel,
    private readonly sse: SseGateway,
    private readonly caseFiles: CaseFileService,
  ) {}

  /** Fire-and-forget: drives one investigation to completion, streaming as it goes. */
  run(investigation: Investigation): void {
    void this.drive(investigation).catch((err) => this.log.error(`investigation ${investigation.id} failed`, err));
  }

  private async drive(investigation: Investigation): Promise<void> {
    const { signal } = investigation;
    const scenario = getScenario(signal.scenarioId);
    const nodes = new Map<string, GraphNode>(investigation.graph.nodes.map((n) => [n.id, n]));
    const edges = new Map<string, GraphEdge>(investigation.graph.edges.map((e) => [e.id, e]));
    let hypotheses: Hypothesis[] = investigation.hypotheses;

    await this.store.updateInvestigation(investigation.id, { status: 'investigating' });

    for await (const ev of runInvestigation(signal, {
      splunk: this.splunk,
      model: this.model,
      indexes: scenario.indexes,
    })) {
      await this.store.appendTrace(ev);
      this.sse.publish(ev);

      switch (ev.type) {
        case 'hypotheses_formed':
          hypotheses = (ev.data?.hypotheses as Hypothesis[]) ?? hypotheses;
          break;
        case 'hypothesis_confirmed':
        case 'hypothesis_rejected': {
          const id = ev.data?.hypothesisId as string;
          hypotheses = hypotheses.map((h) =>
            h.id === id
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
          if (node) nodes.set(node.id, node);
          break;
        }
        case 'edge_discovered': {
          const edge = ev.data?.edge as GraphEdge | undefined;
          if (edge) edges.set(edge.id, edge);
          break;
        }
      }

      await this.store.updateInvestigation(investigation.id, {
        hypotheses,
        graph: { nodes: [...nodes.values()], edges: [...edges.values()] },
      });
    }

    const completed = await this.store.updateInvestigation(investigation.id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    if (completed) await this.caseFiles.generate(completed);
  }
}
