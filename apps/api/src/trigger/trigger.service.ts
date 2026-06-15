import { Inject, Injectable, Logger } from '@nestjs/common';
import { getScenario } from '@synt/scenarios';
import type { Investigation, ScenarioId } from '@synt/shared';
import type { SplunkClient } from '@synt/splunk';
import { randomUUID } from 'crypto';
import { AgentRunner } from '../agent/agent.runner';
import { SPLUNK_CLIENT } from '../splunk/splunk.module';
import { STORE } from '../store/store.module';
import type { Store } from '../store/store';

@Injectable()
export class TriggerService {
  private readonly log = new Logger('Trigger');

  constructor(
    @Inject(STORE) private readonly store: Store,
    @Inject(SPLUNK_CLIENT) private readonly splunk: SplunkClient,
    private readonly runner: AgentRunner,
  ) {}

  /** Seed the scenario into Splunk (HEC / mock) and dispatch an investigation. */
  async inject(id: ScenarioId): Promise<Investigation> {
    const scenario = getScenario(id);

    // Push seed events into the right indexes.
    const byIndex = new Map<string, Record<string, unknown>[]>();
    for (const ev of scenario.seedEvents()) {
      const index = String(ev.index ?? scenario.indexes[0]);
      (byIndex.get(index) ?? byIndex.set(index, []).get(index)!).push(ev);
    }
    for (const [index, events] of byIndex) {
      await this.splunk.ingest(index, events);
      this.log.log(`ingested ${events.length} events into ${index}`);
    }

    const investigationId = randomUUID();
    const investigation: Investigation = {
      id: investigationId,
      signal: { ...scenario.triggerSignal, id: investigationId },
      status: 'queued',
      hypotheses: [],
      graph: { nodes: [], edges: [] },
      startedAt: new Date().toISOString(),
    };

    await this.store.createInvestigation(investigation);
    this.runner.run(investigation);
    return investigation;
  }
}
