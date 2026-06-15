'use client';

import type { CaseFile, Investigation } from '@synt/shared';
import { ArrowLeft, FileText, Network, X } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CaseFileView } from '../../../components/CaseFileView';
import { ForceGraph } from '../../../components/ForceGraph';
import { HypothesisRail } from '../../../components/HypothesisRail';
import { NlCommandBox } from '../../../components/NlCommandBox';
import { ThoughtStream } from '../../../components/ThoughtStream';
import { Wordmark } from '../../../components/Wordmark';
import { api } from '../../../lib/api';
import { cx, fmtStatus, severityPill, statusPill } from '../../../lib/ui';
import { useInvestigationStream } from '../../../lib/useInvestigationStream';

export default function TheatrePage() {
  const id = useParams().id as string;
  const stream = useInvestigationStream(id);
  const [inv, setInv] = useState<Investigation | null>(null);
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    api.investigation(id).then(setInv).catch(() => {});
  }, [id]);

  // When the agent finishes, poll for the case file (PDF render takes a beat) and auto-open.
  useEffect(() => {
    if (!stream.complete) return;
    let stop = false;
    const tryFetch = async () => {
      try {
        const cf = await api.caseFile(id);
        if (!stop) {
          setCaseFile(cf);
          setDrawerOpen(true);
        }
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

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-app-border px-6 py-3">
        <Link href="/" className="text-zinc-500 transition-colors hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <Wordmark sub="Reasoning Theatre" />
        {inv && (
          <span className={cx('rounded px-1.5 py-0.5 text-xs font-medium', severityPill[inv.signal.severity])}>
            {inv.signal.severity}
          </span>
        )}
        <p className="truncate text-sm text-zinc-400">{inv?.signal.title}</p>
        <span className={cx('ml-auto rounded px-2 py-1 text-xs font-medium', statusPill[status])}>
          {fmtStatus(status)}
        </span>
        {caseFile && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90"
          >
            <FileText size={13} /> Case file
          </button>
        )}
      </header>

      {/* Body: thought stream | graph | hypotheses */}
      <div className="grid min-h-0 flex-1 grid-cols-[380px_1fr_300px]">
        <section className="min-h-0 border-r border-app-border">
          <ThoughtStream events={stream.events} />
        </section>

        <section className="relative min-h-0 bg-app-surface">
          <div className="flex items-center gap-2 border-b border-app-border px-5 py-3">
            <Network size={15} className="text-brand" />
            <h2 className="text-sm font-semibold">Investigation graph</h2>
            <span className="ml-auto text-xs text-zinc-500">
              {stream.nodes.length} entities · {stream.edges.length} links
            </span>
          </div>
          <div className="h-[calc(100%-49px)]">
            <ForceGraph nodes={stream.nodes} edges={stream.edges} focusNodeId={stream.focusNodeId} />
          </div>
        </section>

        <section className="min-h-0 border-l border-app-border bg-app-surface">
          <HypothesisRail hypotheses={stream.hypotheses} />
        </section>
      </div>

      {/* NL command box */}
      <NlCommandBox investigationId={id} />

      {/* Case file drawer */}
      {drawerOpen && caseFile && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full w-full max-w-2xl overflow-y-auto border-l border-app-border bg-app-bg p-8 shadow-2xl transition-transform duration-300">
            <button
              onClick={() => setDrawerOpen(false)}
              className="absolute right-6 top-6 text-zinc-500 transition-colors hover:text-white"
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
