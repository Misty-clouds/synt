/**
 * @synt/shared — single source of truth for data contracts across api + web.
 * See PRD §5.
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type InvestigationStatus =
  | 'queued'
  | 'investigating'
  | 'completed'
  | 'awaiting_approval'
  | 'responded'
  | 'dismissed';

export type ScenarioId =
  | 'cred_stuffing'
  | 'insider_exfil'
  | 'lateral_movement'
  | 'ransomware_staging';

export const SCENARIO_IDS: ScenarioId[] = [
  'cred_stuffing',
  'insider_exfil',
  'lateral_movement',
  'ransomware_staging',
];

export type EntityType = 'user' | 'host' | 'ip' | 'process' | 'file' | 'domain';

export interface EntityRef {
  type: EntityType;
  value: string;
}

/** The triggering anomaly surfaced from Splunk. */
export interface Signal {
  id: string;
  scenarioId: ScenarioId;
  source: string; // e.g. 'splunk:saved_search:notable'
  title: string;
  severity: Severity;
  rawEventCount: number;
  firstSeen: string; // ISO
  entities: EntityRef[]; // initial entities in the trigger
}

export interface Hypothesis {
  id: string;
  statement: string; // "Credential stuffing against host-12"
  priorConfidence: number; // 0..1 before testing
  status: 'pending' | 'testing' | 'confirmed' | 'rejected';
  posteriorConfidence?: number; // 0..1 after evidence
  splUsed?: string; // the SPL the agent ran to test it
}

export type TraceEventType =
  | 'investigation_started'
  | 'observe'
  | 'hypotheses_formed'
  | 'query_running'
  | 'evidence_found'
  | 'hypothesis_confirmed'
  | 'hypothesis_rejected'
  | 'pivot'
  | 'entity_discovered'
  | 'edge_discovered'
  | 'investigation_complete'
  | 'action_executed'
  | 'error';

/** Emitted by the agent, streamed via SSE, persisted to Mongo. */
export interface TraceEvent {
  id: string;
  investigationId: string;
  ts: string; // ISO
  type: TraceEventType;
  message: string; // human-readable line for the Theatre
  data?: Record<string, unknown>; // structured payload (entity, edge, spl, results)
}

export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  suspicious: boolean;
}

export interface GraphEdge {
  id: string;
  from: string;
  to: string;
  relation: string;
}

export interface MitreTechnique {
  id: string;
  name: string;
  tactic: string;
}

export type PlaybookActionKind =
  | 'isolate_host'
  | 'disable_user'
  | 'block_ip'
  | 'block_domain'
  | 'revoke_sessions'
  | 'open_ticket';

export interface PlaybookAction {
  id: string;
  kind: PlaybookActionKind;
  target: string; // entity value
  rationale: string;
  blastRadius: 'low' | 'medium' | 'high';
  autoApprovable: boolean; // confidence-gated autonomy
  status: 'proposed' | 'approved' | 'rejected' | 'executed';
}

export interface CaseFile {
  id: string;
  investigationId: string;
  title: string;
  severity: Severity;
  confidence: number; // 0..1
  summary: string; // executive narrative
  timeline: { ts: string; event: string }[];
  blastRadius: EntityRef[]; // hosts/users/ips affected
  mitre: MitreTechnique[];
  recommendedPlaybook: PlaybookAction[];
  pdfUrl?: string; // R2 link once generated
  createdAt: string;
}

export interface Investigation {
  id: string;
  signal: Signal;
  status: InvestigationStatus;
  hypotheses: Hypothesis[];
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  caseFileId?: string;
  startedAt: string;
  completedAt?: string;
}

/** A single tabular row returned from a Splunk search. */
export type SplunkRow = Record<string, unknown>;
