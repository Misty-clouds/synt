'use client';

import type { CaseFile, Investigation } from '@synt/shared';
import { FileText, Network, ShieldCheck, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CaseFileView } from '../../../components/CaseFileView';
import { HypothesisRail } from '../../../components/HypothesisRail';
import { InvestigationGraph } from '../../../components/InvestigationGraph';
import { Logo } from '../../../components/Logo';
import { NlCommandBox } from '../../../components/NlCommandBox';
import { ResponseDrawer } from '../../../components/ResponseDrawer';
import { ThoughtStream } from '../../../components/ThoughtStream';
import { api } from '../../../lib/api';
import { cx, fmtStatus, severityPill, statusPill } from '../../../lib/ui';
import { useInvestigationStream } from '../../../lib/useInvestigationStream';

export default function TheatrePage() {
  const id = useParams().id as string;
  const stream = useInvestigationStream(id);
  const [inv, setInv] = useState<Investigation | null>(null);
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [caseOpen, setCaseOpen] = useState(false);
  const [responseOpen, setResponseOpen] = useState(false);

  useEffect(() => {
    api.investigation(id).then(setInv).catch(() => {});
  }, [id]);

  // When the agent finishes revealing, fetch the case file (do NOT auto-open anything).
  useEffect(() => {
    if (!stream.complete) return;
    let stop = false;
    const tryFetch = async () => {
      try {
        const cf = await api.caseFile(id);
        if (!stop) setCaseFile(cf);
      } catch {
        if (!stop) setTimeout(tryFetch, 800);
      }
    };
    tryFetch();
    api.investigation(id).then(setInv).catch(() => {});
    return () => {
      stop = true;
    };
  }, [stream.complete, id]);

  const status = inv?.status ?? (stream.complete ? 'completed' : 'investigating');
  const pendingActions = caseFile?.recommendedPlaybook.filter((a) => a.status === 'proposed').length ?? 0;

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-app-border px-6 py-3">
        <Logo size={30} showText sub="Reasoning Theatre" />
        {inv && (
          <span className={cx('ml-2 rounded px-1.5 py-0.5 text-xs font-medium', severityPill[inv.signal.severity])}>
            {inv.signal.severity}
          </span>
        )}
        <p className="truncate text-sm text-muted">{inv?.signal.title}</p>
        <span className={cx('ml-auto rounded px-2 py-1 text-xs font-medium', statusPill[status])}>
          {fmtStatus(status)}
        </span>
        {caseFile && (
          <button
            onClick={() => setCaseOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-app-border bg-app-card px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-app-card-hover"
          >
            <FileText size={13} /> Case file
          </button>
        )}
      </header>

      {/* Body: thought stream | graph | hypotheses + respond */}
      <div className="grid min-h-0 flex-1 grid-cols-[380px_1fr_320px]">
        <section className="min-h-0 border-r border-app-border">
          <ThoughtStream events={stream.events} thinking={stream.thinking} />
        </section>

        <section className="relative min-h-0 bg-app-surface">
          <div className="flex items-center gap-2 border-b border-app-border px-5 py-3">
            <Network size={15} className="text-brand" />
            <h2 className="text-sm font-semibold">Investigation graph</h2>
            <span className="ml-auto text-xs text-dim">
              {stream.nodes.length} entities · {stream.edges.length} links
            </span>
          </div>
          <div className="h-[calc(100%-49px)]">
            <InvestigationGraph nodes={stream.nodes} edges={stream.edges} focusNodeId={stream.focusNodeId} />
          </div>
        </section>

        <section className="flex min-h-0 flex-col border-l border-app-border bg-app-surface">
          <div className="min-h-0 flex-1">
            <HypothesisRail hypotheses={stream.hypotheses} />
          </div>
          {/* Respond action — opens the response playbook drawer */}
          <div className="border-t border-app-border p-3">
            <button
              onClick={() => setResponseOpen(true)}
              disabled={!caseFile}
              className={cx(
                'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                caseFile
                  ? 'bg-brand text-white hover:bg-brand/90'
                  : 'cursor-not-allowed border border-app-border bg-app-card text-faint',
              )}
            >
              <ShieldCheck size={16} />
              {caseFile ? 'Respond' : 'Awaiting conclusion…'}
              {pendingActions > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">{pendingActions}</span>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* NL command box */}
      <NlCommandBox investigationId={id} />

      {/* Response playbook drawer */}
      {responseOpen && caseFile && (
        <ResponseDrawer caseFile={caseFile} onUpdate={setCaseFile} onClose={() => setResponseOpen(false)} />
      )}

      {/* Case file drawer (read-only) */}
      {caseOpen && caseFile && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCaseOpen(false)} />
          <div className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-app-border bg-app-bg p-8 shadow-2xl">
            <button
              onClick={() => setCaseOpen(false)}
              className="absolute right-6 top-6 text-dim transition-colors hover:text-white"
            >
              <X size={20} />
            </button>
            <CaseFileView caseFile={caseFile} />
          </div>
        </div>
      )}
    </div>
  );
}
