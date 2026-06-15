import { scenarioList } from '@synt/scenarios';
import type { PlaybookAction, SplunkRow } from '@synt/shared';
import type { SplunkClient } from './types';

/**
 * In-memory Splunk for offline development and deterministic demos.
 * It does NOT implement SPL — it applies a pragmatic filter (index + `field=value`
 * constraints + free-text keywords) good enough that the agent's real queries return
 * coherent result sets. Swap for `makeMcpSplunkClient` against a live Splunk + MCP server.
 */
export function makeMockSplunkClient(opts?: { preseed?: boolean }): SplunkClient {
  const store: Record<string, SplunkRow[]> = {};
  const executedActions: PlaybookAction[] = [];

  const add = (index: string, events: Record<string, unknown>[]) => {
    store[index] = store[index] ?? [];
    for (const ev of events) store[index].push({ ...ev, index });
  };

  // Pre-seed every scenario so search works even before an explicit inject.
  if (opts?.preseed !== false) {
    for (const sc of scenarioList) {
      const grouped = groupByIndex(sc.seedEvents());
      for (const [index, events] of Object.entries(grouped)) add(index, events);
    }
  }

  return {
    live: false,
    async search(spl, _earliest, _latest) {
      const idx = /index\s*=\s*([\w]+)/.exec(spl)?.[1];
      const pairs = extractPairs(spl);
      const keywords = extractKeywords(spl);
      const pools = idx ? [store[idx] ?? []] : Object.values(store);
      const rows: SplunkRow[] = [];
      for (const pool of pools) {
        for (const ev of pool) {
          if (matchesPairs(ev, pairs) && matchesKeywords(ev, keywords)) rows.push(ev);
        }
      }
      // Honor a trailing `| head N`.
      const head = /\|\s*head\s+(\d+)/.exec(spl)?.[1];
      const limited = head ? rows.slice(0, Number(head)) : rows;
      return limited.sort(byTimeDesc);
    },
    async ingest(index, events) {
      add(index, events);
    },
    async respond(action: PlaybookAction) {
      executedActions.push(action);
      return { ok: true, live: false };
    },
  };
}

function groupByIndex(events: Record<string, unknown>[]): Record<string, Record<string, unknown>[]> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const ev of events) {
    const index = String(ev.index ?? 'main');
    (out[index] = out[index] ?? []).push(ev);
  }
  return out;
}

const RESERVED = new Set(['index', 'earliest', 'latest', 'sourcetype_OPTIONAL']);

function extractPairs(spl: string): [string, string][] {
  const pairs: [string, string][] = [];
  // Only the search portion before the first pipe carries raw field constraints;
  // anything after `|` references computed fields (stats/eval output).
  const head = spl.split('|')[0];
  const re = /(\w+)\s*=\s*("[^"]*"|'[^']*'|[^\s|)]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(head))) {
    const key = m[1];
    if (RESERVED.has(key)) continue;
    const val = m[2].replace(/^['"]|['"]$/g, '');
    pairs.push([key, val]);
  }
  return pairs;
}

/** Free-text terms (quoted or bare) that aren't part of `key=value` or pipe commands. */
function extractKeywords(spl: string): string[] {
  // Only consider the search before the first pipe; commands after rarely filter raw text.
  const head = spl.split('|')[0];
  const withoutPairs = head.replace(/(\w+)\s*=\s*("[^"]*"|'[^']*'|[^\s|)]+)/g, ' ');
  return withoutPairs
    .split(/\s+/)
    .map((t) => t.replace(/^['"]|['"]$/g, '').trim())
    .filter((t) => t.length > 2 && !/^(search|index|AND|OR|NOT)$/i.test(t));
}

function matchesPairs(ev: SplunkRow, pairs: [string, string][]): boolean {
  for (const [key, val] of pairs) {
    // A constrained field the event lacks means it doesn't match (real-SPL behavior),
    // which keeps each scenario's queries scoped to its own seeded events.
    if (!(key in ev)) return false;
    const evVal = String(ev[key]).toLowerCase();
    if (evVal !== val.toLowerCase() && !evVal.includes(val.toLowerCase())) return false;
  }
  return true;
}

function matchesKeywords(ev: SplunkRow, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const hay = JSON.stringify(ev).toLowerCase();
  return keywords.every((k) => hay.includes(k.toLowerCase()));
}

function byTimeDesc(a: SplunkRow, b: SplunkRow): number {
  const ta = Date.parse(String(a._time ?? 0));
  const tb = Date.parse(String(b._time ?? 0));
  return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
}
