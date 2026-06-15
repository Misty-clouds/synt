'use client';

import type { Hypothesis } from '@synt/shared';
import { cx } from '../lib/ui';

export function HypothesisRail({ hypotheses }: { hypotheses: Hypothesis[] }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-app-border px-5 py-3">
        <h2 className="text-sm font-semibold">Hypotheses</h2>
        <p className="text-xs text-dim">{hypotheses.length === 0 ? 'forming…' : `${hypotheses.length} under test`}</p>
      </div>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-3">
        {hypotheses.length === 0 && <p className="px-2 py-4 text-xs text-faint">Forming hypotheses…</p>}
        {hypotheses.map((h, i) => {
          const conf = h.posteriorConfidence ?? h.priorConfidence;
          const tone =
            h.status === 'confirmed'
              ? 'border-green-500/30'
              : h.status === 'rejected'
                ? 'border-red-500/20 opacity-60'
                : h.status === 'testing'
                  ? 'border-brand/40'
                  : 'border-app-border';
          return (
            <div
              key={h.id}
              className={cx('synt-reveal rounded-xl border bg-app-card-alt p-3', tone)}
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <p className="text-[13px] leading-snug text-ink/90">{h.statement}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-app-border">
                  <div
                    className={cx(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      h.status === 'confirmed' ? 'bg-green-500' : h.status === 'rejected' ? 'bg-red-500' : 'bg-brand',
                    )}
                    style={{ width: `${Math.round(conf * 100)}%` }}
                  />
                </div>
                <span className="w-9 text-right font-mono text-[11px] text-muted">{Math.round(conf * 100)}%</span>
              </div>
              <span
                className={cx(
                  'mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                  h.status === 'confirmed'
                    ? 'bg-green-500/10 text-green-500'
                    : h.status === 'rejected'
                      ? 'bg-red-500/10 text-red-500'
                      : h.status === 'testing'
                        ? 'bg-brand/10 text-brand'
                        : 'bg-zinc-500/10 text-muted',
                )}
              >
                {h.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
