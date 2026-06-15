'use client';

import type { CaseFile, PlaybookAction } from '@synt/shared';
import { Check, Download, FileText, Shield, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { cx, fmtTime, severityPill } from '../lib/ui';

export function CaseFileView({ caseFile: initial }: { caseFile: CaseFile }) {
  const [caseFile, setCaseFile] = useState(caseFile0(initial));
  const [busy, setBusy] = useState<string | null>(null);

  async function act(actionId: string, kind: 'approve' | 'reject') {
    setBusy(actionId);
    try {
      const updated = kind === 'approve'
        ? await api.approve(caseFile.investigationId, actionId)
        : await api.reject(caseFile.investigationId, actionId);
      setCaseFile(updated);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className={cx('rounded px-1.5 py-0.5 text-xs font-medium', severityPill[caseFile.severity])}>
              {caseFile.severity.toUpperCase()}
            </span>
            <span className="rounded bg-brand/10 px-1.5 py-0.5 text-xs font-medium text-brand">
              {Math.round(caseFile.confidence * 100)}% confidence
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">{caseFile.title}</h1>
          <p className="mt-0.5 font-mono text-xs text-zinc-500">case {caseFile.id.slice(0, 8)}</p>
        </div>
        {caseFile.pdfUrl && (
          <a
            href={caseFile.pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-brand px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90"
          >
            <Download size={15} /> Download case file (PDF)
          </a>
        )}
      </div>

      <Section icon={FileText} title="Executive summary">
        <p className="text-sm leading-relaxed text-zinc-300">{caseFile.summary}</p>
      </Section>

      <Section title="Timeline">
        <div className="space-y-2">
          {caseFile.timeline.map((t, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono text-xs text-zinc-500">{fmtTime(t.ts)}</span>
              <span className="text-zinc-300">{t.event}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Shield} title="Blast radius">
        <div className="flex flex-wrap gap-2">
          {caseFile.blastRadius.map((e, i) => (
            <span key={i} className="rounded-md border border-app-border bg-app-card-alt px-2.5 py-1 text-xs">
              <span className="text-zinc-500">{e.type}</span> <span className="text-zinc-200">{e.value}</span>
            </span>
          ))}
        </div>
      </Section>

      <Section title="MITRE ATT&CK">
        <div className="space-y-1.5">
          {caseFile.mitre.map((m) => (
            <div key={m.id} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 font-mono text-xs font-semibold text-brand">{m.id}</span>
              <span className="text-zinc-200">{m.name}</span>
              <span className="ml-auto text-xs text-zinc-500">{m.tactic}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Recommended response playbook">
        <div className="space-y-2.5">
          {caseFile.recommendedPlaybook.map((a) => (
            <ActionCard key={a.id} action={a} busy={busy === a.id} onAct={(k) => act(a.id, k)} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function caseFile0(cf: CaseFile): CaseFile {
  return cf;
}

function ActionCard({
  action,
  busy,
  onAct,
}: {
  action: PlaybookAction;
  busy: boolean;
  onAct: (kind: 'approve' | 'reject') => void;
}) {
  const decided = action.status === 'executed' || action.status === 'rejected' || action.status === 'approved';
  return (
    <div className="rounded-xl border border-app-border bg-app-card-alt p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-zinc-100">{action.kind}</span>
            <span className="text-sm text-zinc-400">→ {action.target}</span>
            {action.autoApprovable && action.status !== 'executed' && (
              <span className="flex items-center gap-1 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                <Zap size={10} /> auto-eligible
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-zinc-400">{action.rationale}</p>
          <p className="mt-1 text-[11px] text-zinc-600">blast radius: {action.blastRadius}</p>
        </div>

        {action.status === 'executed' ? (
          <span className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-medium bg-green-500/10 text-green-500">
            <Check size={12} /> executed
          </span>
        ) : action.status === 'rejected' ? (
          <span className="shrink-0 rounded bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">rejected</span>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => onAct('approve')}
              disabled={busy || decided}
              className="flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-40"
            >
              <Check size={13} /> Approve
            </button>
            <button
              onClick={() => onAct('reject')}
              disabled={busy || decided}
              className="flex items-center gap-1 rounded-lg border border-app-border px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-app-card-hover disabled:opacity-40"
            >
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: typeof Shield;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {Icon && <Icon size={13} />} {title}
      </h3>
      {children}
    </div>
  );
}
