import type { ScenarioId } from '@synt/shared';
import type { Scenario } from './types';
import { credStuffing } from './cred-stuffing';
import { insiderExfil } from './insider-exfil';
import { lateralMovement } from './lateral-movement';
import { ransomwareStaging } from './ransomware-staging';

export * from './types';
export { DEMO_NOW } from './util';

export const scenarios: Record<ScenarioId, Scenario> = {
  cred_stuffing: credStuffing,
  insider_exfil: insiderExfil,
  lateral_movement: lateralMovement,
  ransomware_staging: ransomwareStaging,
};

export const scenarioList: Scenario[] = Object.values(scenarios);

export function getScenario(id: ScenarioId): Scenario {
  const s = scenarios[id];
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

export { credStuffing, insiderExfil, lateralMovement, ransomwareStaging };
