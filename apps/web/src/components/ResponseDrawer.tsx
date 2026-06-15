'use client';

import type { CaseFile, PlaybookAction } from '@synt/shared';
import { Check, ShieldCheck, X, Zap } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';
import { cx } from '../lib/ui';

export function ResponseDrawer({
  caseFile,
  onUpdate,
  onClose,
}: {
  caseFile: CaseFile;
  onUpdate: (cf: CaseFile) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function act(actionId: string, kind: 'approve' | 'reject') {
    setBusy(actionId);
    try {
      const updated =
        kind === 'approve'
          ? await api.approve(caseFile.investigationId, actionId)
          : await api.reject(caseFile.investigationId, actionId);
      onUpdate(updated);
    } finally {
      setBusy(null);
    }
  }

  const pending = caseFile.recommendedPlaybook.filter((a) => a.status === 'proposed').length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-app-border bg-app-bg shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center gap-2.5 border-b border-app-border bg-app-bg/95 px-6 py-4 backdrop-blur">
          <ShieldCheck size={17} className="text-brand" />
          <div>
            <h2 className="text-sm font-semibold">Response playbook</h2>
            <p className="text-xs text-dim">
              {pending > 0 ? `${pending} action${pending > 1 ? 's' : ''} awaiting approval` : 'all actions resolved'}
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-dim transition-colors hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 p-6">
          {caseFile.recommendedPlaybook.map((a) => (
            <ActionCard key={a.id} action={a} busy={busy === a.id} onAct={(k) => act(a.id, k)} />
          ))}
        </div>
      </div>
    </div>
  );
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
  const decided = action.status !== 'proposed';
  return (
    <div className="rounded-xl border border-app-border bg-app-card-alt p-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-semibold text-ink">{action.kind}</span>
        <span className="text-sm text-muted">→ {action.target}</span>
        {action.autoApprovable && action.status !== 'executed' && (
          <span className="flex items-center gap-1 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand">
            <Zap size={10} /> auto-eligible
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-muted">{action.rationale}</p>
      <p className="mt-1 text-[11px] text-faint">blast radius: {action.blastRadius}</p>

      <div className="mt-3">
        {action.status === 'executed' ? (
          <span className="flex w-fit items-center gap-1 rounded bg-green-500/10 px-2 py-1 text-xs font-medium text-green-500">
            <Check size={12} /> executed
          </span>
        ) : action.status === 'rejected' ? (
          <span className="rounded bg-red-500/10 px-2 py-1 text-xs font-medium text-red-500">rejected</span>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onAct('approve')}
              disabled={busy || decided}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-40"
            >
              <Check size={13} /> Approve
            </button>
            <button
              onClick={() => onAct('reject')}
              disabled={busy || decided}
              className={cx(
                'flex items-center justify-center gap-1.5 rounded-lg border border-app-border px-3 py-2 text-xs font-medium text-muted transition-colors hover:bg-app-card-hover disabled:opacity-40',
              )}
            >
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
