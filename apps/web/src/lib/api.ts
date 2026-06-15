import type { CaseFile, Investigation, Severity, TraceEvent } from '@synt/shared';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface ScenarioMeta {
  id: string;
  title: string;
  description: string;
  indexes: string[];
  severity: Severity;
  mitre: { id: string; name: string; tactic: string }[];
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  scenarios: () => get<ScenarioMeta[]>('/scenarios'),
  inject: (id: string) => post<Investigation>(`/scenarios/${id}/inject`),
  investigations: () => get<Investigation[]>('/investigations'),
  investigation: (id: string) => get<Investigation>(`/investigations/${id}`),
  trace: (id: string) => get<TraceEvent[]>(`/investigations/${id}/trace`),
  caseFile: (id: string) => get<CaseFile>(`/investigations/${id}/case`),
  approve: (id: string, actionId: string) =>
    post<CaseFile>(`/investigations/${id}/actions/${actionId}/approve`),
  reject: (id: string, actionId: string) =>
    post<CaseFile>(`/investigations/${id}/actions/${actionId}/reject`),
  command: (id: string, text: string) =>
    post<{ spl: string; count: number; answer: string }>(`/investigations/${id}/command`, { text }),
  streamUrl: (id: string) => `${API_BASE}/investigations/${id}/stream`,
};
