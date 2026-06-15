import type { EntityRef, MitreTechnique, ScenarioId, Signal } from '@synt/shared';

export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  indexes: string[];
  /** Generated events with realistic timestamps, each tagged with its `index`. */
  seedEvents: () => Record<string, unknown>[];
  /** What fires the investigation. */
  triggerSignal: Signal;
  /** For verification / demo confidence — the agent should converge here. */
  groundTruth: {
    rootCause: string;
    blastRadius: EntityRef[];
    mitre: MitreTechnique[];
  };
}
