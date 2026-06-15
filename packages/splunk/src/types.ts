import type {
  CaseFile,
  EntityRef,
  Hypothesis,
  MitreTechnique,
  PlaybookAction,
  Signal,
  SplunkRow,
} from '@synt/shared';

export type { SplunkRow };

/** The agent's hands: every Splunk search + response action goes through here. */
export interface SplunkClient {
  /** Whether this client talks to a real Splunk/MCP server (vs the in-memory mock). */
  readonly live: boolean;
  search(spl: string, earliest?: string, latest?: string): Promise<SplunkRow[]>;
  /** Push scenario seed data into an index (real: HEC; mock: in-memory). */
  ingest(index: string, events: Record<string, unknown>[]): Promise<void>;
  /** Execute a response action (real: MCP action; mock/stub: recorded only). */
  respond(action: PlaybookAction): Promise<{ ok: boolean; live: boolean }>;
}

/** The agent's brain: all reasoning goes through a hosted model. */
export interface HostedModel {
  complete(prompt: string, opts?: { temperature?: number }): Promise<string>;
  /** Structured output: the instruction describes the JSON shape to return. */
  json<T>(prompt: string, instruction: string): Promise<T>;
  /** Natural language → SPL, constrained to the given indexes. */
  nlToSpl(question: string, indexes: string[]): Promise<string>;
}

/** Structured shapes the agent asks the model to produce. */
export interface HypothesisDraft {
  statement: string;
  priorConfidence: number;
}

export interface EvidenceVerdict {
  confirmed: boolean;
  posteriorConfidence: number;
  evidence: string;
  /** New leads worth pivoting into, if any. */
  pivot?: string;
}

export interface CaseFileDraft {
  title: string;
  summary: string;
  mitre: MitreTechnique[];
  blastRadius: EntityRef[];
  playbook: Omit<PlaybookAction, 'id' | 'status'>[];
}

export interface SplunkEnv {
  USE_MOCK_SPLUNK?: string;
  SPLUNK_MCP_URL?: string;
  SPLUNK_MCP_TOKEN?: string;
  SPLUNK_TOKEN?: string;
  SPLUNK_HEC_URL?: string;
  SPLUNK_HEC_TOKEN?: string;
  SPLUNK_MODEL_ENDPOINT?: string;
  SPLUNK_MODEL_TOKEN?: string;
  SPLUNK_MODEL_NAME?: string;
}

export type { CaseFile, Hypothesis, Signal };
