import type { PlaybookAction, SplunkRow } from '@synt/shared';
import type { SplunkClient, SplunkEnv } from './types';

/**
 * Real Splunk client. Searches + response actions go through the Splunk MCP Server
 * (JSON-RPC 2.0 over the MCP "streamable HTTP" transport); seed ingest uses Splunk HEC.
 *
 * MCP tool names vary by build; we discover them at construction via `tools/list` and
 * pick the best match. If the running MCP build exposes no response-action tool,
 * `respond()` returns `{ ok: true, live: false }` so the app can record a simulated action.
 */
export function makeMcpSplunkClient(env: SplunkEnv): SplunkClient {
  const mcpUrl = env.SPLUNK_MCP_URL;
  if (!mcpUrl) throw new Error('SPLUNK_MCP_URL is required for the real Splunk client');

  let toolNames: string[] = [];
  let initialized = false;
  let rpcId = 0;

  async function rpc<T = unknown>(method: string, params?: unknown): Promise<T> {
    const res = await fetch(mcpUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        ...(env.SPLUNK_MCP_TOKEN ? { Authorization: `Bearer ${env.SPLUNK_MCP_TOKEN}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcId, method, params }),
    });
    if (!res.ok) throw new Error(`MCP ${method} failed: ${res.status} ${await res.text()}`);
    const text = await res.text();
    const payload = parseMaybeSse(text);
    if (payload.error) throw new Error(`MCP ${method} error: ${JSON.stringify(payload.error)}`);
    return payload.result as T;
  }

  async function ensureInit(): Promise<void> {
    if (initialized) return;
    await rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'synt', version: '0.0.0' },
    });
    const listed = await rpc<{ tools: { name: string }[] }>('tools/list');
    toolNames = (listed?.tools ?? []).map((t) => t.name);
    initialized = true;
  }

  function pickTool(candidates: string[]): string | undefined {
    return candidates.find((c) => toolNames.includes(c)) ?? toolNames.find((t) => candidates.some((c) => t.includes(c)));
  }

  async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const result = await rpc<{ content?: { type: string; text?: string }[]; structuredContent?: unknown }>(
      'tools/call',
      { name, arguments: args },
    );
    if (result?.structuredContent) return result.structuredContent;
    const textPart = result?.content?.find((c) => c.type === 'text')?.text;
    if (textPart) {
      try {
        return JSON.parse(textPart);
      } catch {
        return textPart;
      }
    }
    return result;
  }

  return {
    live: true,

    async search(spl, earliest = '-24h', latest = 'now') {
      await ensureInit();
      const tool = pickTool(['run_oneshot_search', 'run_search', 'search', 'splunk_search']);
      if (!tool) throw new Error(`No Splunk search tool found in MCP server. Tools: ${toolNames.join(', ')}`);
      const query = spl.trim().startsWith('search') || spl.trim().startsWith('|') ? spl : `search ${spl}`;
      const out = await callTool(tool, {
        query,
        search: query,
        earliest_time: earliest,
        latest_time: latest,
      });
      return normalizeRows(out);
    },

    async ingest(index, events) {
      const hecUrl = env.SPLUNK_HEC_URL;
      const hecToken = env.SPLUNK_HEC_TOKEN;
      if (!hecUrl || !hecToken) throw new Error('SPLUNK_HEC_URL and SPLUNK_HEC_TOKEN are required to ingest seed data');
      const body = events
        .map((ev) => {
          const { _time, ...rest } = ev as Record<string, unknown>;
          const time = _time ? Date.parse(String(_time)) / 1000 : Date.now() / 1000;
          return JSON.stringify({ time, index, sourcetype: rest.sourcetype ?? 'synt:seed', event: rest });
        })
        .join('\n');
      const res = await fetch(hecUrl, {
        method: 'POST',
        headers: { Authorization: `Splunk ${hecToken}`, 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error(`HEC ingest failed: ${res.status} ${await res.text()}`);
    },

    async respond(action: PlaybookAction) {
      await ensureInit();
      const tool = pickTool(['run_response_action', 'response_action', 'execute_action', 'splunk_soar_action']);
      if (!tool) return { ok: true, live: false }; // no live action tool — caller records a simulated action
      await callTool(tool, { action: action.kind, target: action.target });
      return { ok: true, live: true };
    },
  };
}

/** MCP streamable HTTP may return a JSON body or an SSE stream of `data:` lines. */
function parseMaybeSse(text: string): { result?: unknown; error?: unknown } {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  const dataLines = trimmed
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim());
  for (const line of dataLines.reverse()) {
    try {
      const obj = JSON.parse(line);
      if (obj.result || obj.error) return obj;
    } catch {
      /* ignore non-JSON keepalives */
    }
  }
  return {};
}

function normalizeRows(out: unknown): SplunkRow[] {
  if (Array.isArray(out)) return out as SplunkRow[];
  if (out && typeof out === 'object') {
    const o = out as Record<string, unknown>;
    if (Array.isArray(o.results)) return o.results as SplunkRow[];
    if (Array.isArray(o.rows)) return o.rows as SplunkRow[];
  }
  return [];
}
