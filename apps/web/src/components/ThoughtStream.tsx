'use client';

import type { TraceEvent, TraceEventType } from '@synt/shared';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Eye,
  Flag,
  GitBranch,
  ListChecks,
  Play,
  Search,
  Spline,
  Terminal,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { fmtTime } from '../lib/ui';

const ICON: Record<TraceEventType, LucideIcon> = {
  investigation_started: Play,
  observe: Eye,
  hypotheses_formed: ListChecks,
  query_running: Terminal,
  evidence_found: Search,
  hypothesis_confirmed: CheckCircle2,
  hypothesis_rejected: XCircle,
  pivot: GitBranch,
  entity_discovered: CircleDot,
  edge_discovered: Spline,
  investigation_complete: Flag,
  action_executed: Zap,
  error: AlertTriangle,
};

const TONE: Partial<Record<TraceEventType, string>> = {
  hypothesis_confirmed: 'text-green-500',
  hypothesis_rejected: 'text-red-500',
  pivot: 'text-brand',
  investigation_complete: 'text-brand',
  action_executed: 'text-green-500',
  error: 'text-red-500',
};

export function ThoughtStream({ events }: { events: TraceEvent[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [events.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-app-border px-5 py-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        <h2 className="text-sm font-semibold">Reasoning</h2>
        <span className="ml-auto text-xs text-zinc-500">{events.length} steps</span>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {events.map((ev, i) => (
          <Line key={ev.id} ev={ev} isLast={i === events.length - 1} />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}

function Line({ ev, isLast }: { ev: TraceEvent; isLast: boolean }) {
  const Icon = ICON[ev.type] ?? CircleDot;
  const tone = TONE[ev.type] ?? 'text-zinc-300';
  const subtle = ev.type === 'entity_discovered' || ev.type === 'edge_discovered';
  const spl = ev.data?.spl as string | undefined;

  if (ev.type === 'pivot') {
    return (
      <div className={`my-2 flex items-center gap-2 ${isLast ? 'synt-new' : ''} rounded-md px-2`}>
        <div className="h-px flex-1 bg-brand/30" />
        <GitBranch size={13} className="text-brand" />
        <span className="text-xs font-medium text-brand">{ev.message}</span>
        <div className="h-px flex-1 bg-brand/30" />
      </div>
    );
  }

  return (
    <div className={`flex gap-2.5 rounded-md px-2 py-1.5 ${isLast ? 'synt-new' : ''}`}>
      <Icon size={14} className={`mt-0.5 shrink-0 ${subtle ? 'text-zinc-600' : tone}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] leading-snug ${subtle ? 'text-zinc-500' : 'text-zinc-200'}`}>
          {ev.message}
        </p>
        {spl && ev.type === 'query_running' && (
          <pre className="mt-1.5 overflow-x-auto rounded-md border border-app-border bg-app-card-alt px-3 py-2 font-mono text-[11px] leading-relaxed text-brand">
            {spl}
          </pre>
        )}
      </div>
      <span className="shrink-0 font-mono text-[10px] text-zinc-600">{fmtTime(ev.ts)}</span>
    </div>
  );
}
