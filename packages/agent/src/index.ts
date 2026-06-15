import type {
  EntityRef,
  Hypothesis,
  Signal,
  TraceEvent,
  TraceEventType,
} from '@synt/shared';
import type { EvidenceVerdict, HostedModel, HypothesisDraft, SplunkClient } from '@synt/splunk';
import { entityId, extractEntities } from './entities';

export * from './entities';

export interface AgentDeps {
  splunk: SplunkClient;
  model: HostedModel;
  /** Candidate indexes the agent may query (constrains NL→SPL). */
  indexes: string[];
  maxIterations?: number; // default 10
  earliest?: string; // default '-24h'
  latest?: string; // default 'now'
  now?: () => string; // override clock for deterministic tests
}

const RELATION_BY_FIELD: Record<string, string> = {
  src_ip: 'authenticated_from',
  dest_ip: 'connected_to',
  ip: 'involves',
  dest_host: 'connected_to',
  src_host: 'originates_from',
  host: 'observed_on',
  user: 'involves_user',
  created_user: 'created',
  created_by: 'created_by',
  dest_domain: 'communicated_with',
  domain: 'communicated_with',
  query: 'resolved',
  process: 'executed',
  file_name: 'touched_file',
  new_file_name: 'touched_file',
};

/**
 * The OODA investigation loop (PRD §6). Framework-agnostic: yields TraceEvents the
 * caller persists + streams. `deps` injects Splunk (hands) and a hosted model (brain),
 * so it runs identically against the real MCP/hosted models or the offline mocks.
 */
export async function* runInvestigation(
  signal: Signal,
  deps: AgentDeps,
): AsyncGenerator<TraceEvent> {
  const maxIterations = deps.maxIterations ?? 10;
  const earliest = deps.earliest ?? '-24h';
  const latest = deps.latest ?? 'now';
  const clock = deps.now ?? (() => new Date().toISOString());
  const scenarioTag = `[scenario:${signal.scenarioId}]`;

  let seq = 0;
  const ev = (type: TraceEventType, message: string, data?: Record<string, unknown>): TraceEvent => ({
    id: `${signal.id}_t${seq++}`,
    investigationId: signal.id,
    ts: clock(),
    type,
    message,
    data,
  });

  const knownEntities = new Set<string>();
  const knownEdges = new Set<string>();
  const triggerIds = new Set(signal.entities.map(entityId));
  const primary: EntityRef | undefined = signal.entities[0];

  yield ev('investigation_started', `Investigation opened for: ${signal.title}`, {
    signal,
  });

  // Seed the graph with the entities named in the trigger.
  for (const e of signal.entities) {
    knownEntities.add(entityId(e));
    yield ev('entity_discovered', `Trigger entity: ${e.type} ${e.value}`, {
      node: { id: entityId(e), type: e.type, label: e.value, suspicious: true },
    });
  }

  // ── Observe ────────────────────────────────────────────────────────────
  const observeSpl = `index=${deps.indexes[0]} | head 20`;
  const context = await deps.splunk.search(observeSpl, earliest, latest);
  yield ev('observe', `Pulled ${context.length} recent events from ${deps.indexes[0]} for context.`, {
    spl: observeSpl,
    count: context.length,
  });

  // ── Orient ─────────────────────────────────────────────────────────────
  const orientPrompt =
    `${scenarioTag} [task:hypotheses] You are investigating this Splunk notable:\n` +
    `Title: ${signal.title}\nSeverity: ${signal.severity}\n` +
    `Entities: ${signal.entities.map((e) => `${e.type}=${e.value}`).join(', ')}\n` +
    `Available indexes: ${deps.indexes.join(', ')}\n` +
    `Form 3–5 ranked, testable hypotheses about what happened.`;
  const drafts = await deps.model.json<HypothesisDraft[]>(
    orientPrompt,
    'Return a JSON array of { "statement": string, "priorConfidence": number (0..1) }.',
  );

  const hypotheses: Hypothesis[] = drafts.map((d, i) => ({
    id: `${signal.id}_h${i}`,
    statement: d.statement,
    priorConfidence: clamp01(d.priorConfidence),
    status: 'pending',
  }));
  yield ev('hypotheses_formed', `Formed ${hypotheses.length} hypotheses.`, { hypotheses });

  // ── Decide / Act / Loop ────────────────────────────────────────────────
  let iterations = 0;
  while (iterations < maxIterations) {
    const next = pickNextPending(hypotheses);
    if (!next) break;
    iterations += 1;
    const idx = hypotheses.indexOf(next);
    next.status = 'testing';

    // Decide — generate the SPL to test this hypothesis.
    const question = `${scenarioTag} [hyp:${idx}] ${next.statement}`;
    const spl = await deps.model.nlToSpl(question, deps.indexes);
    next.splUsed = spl;
    yield ev('query_running', `Testing: "${next.statement}"`, { hypothesisId: next.id, spl });

    // Act — run the query through Splunk.
    const rows = await deps.splunk.search(spl, earliest, latest);
    yield ev('evidence_found', `Query returned ${rows.length} events.`, {
      hypothesisId: next.id,
      spl,
      count: rows.length,
      sample: rows.slice(0, 3),
    });

    // Discover entities + edges from the evidence (drives the live graph). Cap new
    // nodes per query so high-volume results (e.g. mass file renames) don't flood it.
    const extracted = extractEntities(rows);
    const discovered = dedupeForGraph(extracted, knownEntities, 10);
    for (const e of discovered) {
      knownEntities.add(entityId(e));
      yield ev('entity_discovered', `Discovered ${e.type}: ${e.value}`, {
        node: { id: entityId(e), type: e.type, label: e.value, suspicious: true },
      });
    }

    // Link the primary entity to the new nodes AND to any trigger entity that turns up
    // in this evidence (so e.g. a compromised user connects to the attacker IP rather
    // than floating disconnected). Edges are de-duplicated across the investigation.
    const edgeTargets = [
      ...discovered,
      ...extracted.filter((e) => triggerIds.has(entityId(e)) && !discovered.some((d) => entityId(d) === entityId(e))),
    ];
    for (const e of edgeTargets) {
      if (!primary) break;
      const id = entityId(e);
      const edgeId = `${entityId(primary)}->${id}`;
      if (id === entityId(primary) || knownEdges.has(edgeId)) continue;
      knownEdges.add(edgeId);
      yield ev('edge_discovered', `${primary.value} → ${e.value}`, {
        edge: {
          id: edgeId,
          from: entityId(primary),
          to: id,
          relation: RELATION_BY_FIELD[e.field] ?? 'related',
        },
      });
    }

    // Update belief — let the model read the evidence and update confidence.
    const evalPrompt =
      `${scenarioTag} [task:evaluate] [hyp:${idx}] [rows:${rows.length}] ` +
      `Hypothesis: "${next.statement}". Evidence sample: ${JSON.stringify(rows.slice(0, 3))}. ` +
      `Did the evidence confirm or reject it? Update confidence.`;
    const verdict = await deps.model.json<EvidenceVerdict>(
      evalPrompt,
      'Return JSON { "confirmed": boolean, "posteriorConfidence": number(0..1), "evidence": string, "pivot"?: string }.',
    );

    next.posteriorConfidence = clamp01(verdict.posteriorConfidence);
    next.status = verdict.confirmed ? 'confirmed' : 'rejected';
    yield ev(
      verdict.confirmed ? 'hypothesis_confirmed' : 'hypothesis_rejected',
      `${verdict.confirmed ? 'Confirmed' : 'Rejected'} (${Math.round(next.posteriorConfidence * 100)}%): ${verdict.evidence}`,
      { hypothesisId: next.id, posteriorConfidence: next.posteriorConfidence },
    );

    if (verdict.confirmed && verdict.pivot) {
      yield ev('pivot', verdict.pivot, { hypothesisId: next.id });
    }

    // Early stop if we have a strong, corroborated conclusion.
    const top = topConfidence(hypotheses);
    const confirmedCount = hypotheses.filter((h) => h.status === 'confirmed').length;
    if (top >= 0.85 && confirmedCount >= 2 && !hypotheses.some((h) => h.status === 'pending' && h.priorConfidence >= 0.4)) {
      break;
    }
  }

  const confirmed = hypotheses.filter((h) => h.status === 'confirmed');
  yield ev('investigation_complete', `Investigation complete — ${confirmed.length} hypotheses confirmed.`, {
    confirmed: confirmed.map((h) => h.statement),
    topConfidence: topConfidence(hypotheses),
    hypotheses,
    iterations,
  });
}

/**
 * Keep the graph legible without starving any one entity type: round-robin across the
 * types present so a high-volume field (e.g. many sprayed users) can't crowd out the
 * few high-signal entities (e.g. the attacker IPs). De-noises files to last.
 */
function dedupeForGraph(
  entities: ReturnType<typeof extractEntities>,
  known: Set<string>,
  limit: number,
): ReturnType<typeof extractEntities> {
  const order = ['user', 'host', 'ip', 'domain', 'process', 'file'];
  const FILE_CAP = 3; // files are high-volume + low-signal as graph nodes — keep a sample
  const buckets = new Map<string, ReturnType<typeof extractEntities>>();
  for (const e of entities) {
    if (known.has(entityId(e))) continue;
    const bucket = buckets.get(e.type) ?? buckets.set(e.type, []).get(e.type)!;
    if (e.type === 'file' && bucket.length >= FILE_CAP) continue;
    bucket.push(e);
  }
  const out: ReturnType<typeof extractEntities> = [];
  let added = true;
  while (added && out.length < limit) {
    added = false;
    for (const type of order) {
      const b = buckets.get(type);
      if (b && b.length) {
        out.push(b.shift()!);
        added = true;
        if (out.length >= limit) break;
      }
    }
  }
  return out;
}

function pickNextPending(hyps: Hypothesis[]): Hypothesis | undefined {
  return hyps
    .filter((h) => h.status === 'pending')
    .sort((a, b) => b.priorConfidence - a.priorConfidence)[0];
}

function topConfidence(hyps: Hypothesis[]): number {
  return hyps.reduce((m, h) => Math.max(m, h.posteriorConfidence ?? 0), 0);
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
