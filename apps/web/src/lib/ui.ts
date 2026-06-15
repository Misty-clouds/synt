import type { Severity } from '@synt/shared';

export const severityPill: Record<Severity, string> = {
  critical: 'bg-red-500/10 text-red-500',
  high: 'bg-orange-500/10 text-orange-500',
  medium: 'bg-yellow-500/10 text-yellow-500',
  low: 'bg-green-500/10 text-green-500',
};

export const statusPill: Record<string, string> = {
  queued: 'bg-zinc-500/10 text-zinc-400',
  investigating: 'bg-brand/10 text-brand',
  completed: 'bg-brand/10 text-brand',
  awaiting_approval: 'bg-yellow-500/10 text-yellow-500',
  responded: 'bg-green-500/10 text-green-500',
  dismissed: 'bg-zinc-500/10 text-zinc-500',
};

export const entityColor: Record<string, string> = {
  user: '#a78bfa',
  host: '#38bdf8',
  ip: '#f472b6',
  domain: '#fb923c',
  process: '#facc15',
  file: '#94a3b8',
};

export function fmtStatus(s: string): string {
  return s.replace(/_/g, ' ');
}

export function fmtTime(ts: string): string {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleTimeString([], { hour12: false });
}

export function cx(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
