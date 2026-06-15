'use client';

import type { CaseFile } from '@synt/shared';
import { Download, FileText, Shield } from 'lucide-react';
import { cx, fmtTime, severityPill } from '../lib/ui';

export function CaseFileView({ caseFile }: { caseFile: CaseFile }) {
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
          <p className="mt-0.5 font-mono text-xs text-dim">case {caseFile.id.slice(0, 8)}</p>
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
        <p className="text-sm leading-relaxed text-muted">{caseFile.summary}</p>
      </Section>

      <Section title="Timeline">
        <div className="space-y-2">
          {caseFile.timeline.map((t, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono text-xs text-dim">{fmtTime(t.ts)}</span>
              <span className="text-muted">{t.event}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Shield} title="Blast radius">
        <div className="flex flex-wrap gap-2">
          {caseFile.blastRadius.map((e, i) => (
            <span key={i} className="rounded-md border border-app-border bg-app-card-alt px-2.5 py-1 text-xs">
              <span className="text-dim">{e.type}</span> <span className="text-ink">{e.value}</span>
            </span>
          ))}
        </div>
      </Section>

      <Section title="MITRE ATT&CK">
        <div className="space-y-1.5">
          {caseFile.mitre.map((m) => (
            <div key={m.id} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 font-mono text-xs font-semibold text-brand">{m.id}</span>
              <span className="text-ink">{m.name}</span>
              <span className="ml-auto text-xs text-dim">{m.tactic}</span>
            </div>
          ))}
        </div>
      </Section>
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
      <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-dim">
        {Icon && <Icon size={13} />} {title}
      </h3>
      {children}
    </div>
  );
}
