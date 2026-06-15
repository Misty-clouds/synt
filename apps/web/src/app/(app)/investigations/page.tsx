'use client';

import type { Investigation } from '@synt/shared';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { cx, fmtStatus, severityPill, statusPill } from '@/lib/ui';

export default function InvestigationsPage() {
  const router = useRouter();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  useEffect(() => {
    const tick = () => api.investigations().then(setInvestigations).catch(() => {});
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between border-b border-app-border px-8 py-[1.1rem]">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Investigations</h1>
          <p className="text-xs text-zinc-500">{investigations.length} total</p>
        </div>
      </header>

      <div className="p-8">
        {investigations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-app-border py-20 text-center">
            <ShieldAlert size={28} className="mb-3 text-zinc-600" />
            <p className="text-sm text-zinc-400">No investigations yet.</p>
            <p className="mt-1 text-xs text-zinc-600">Inject a scenario from the dashboard to begin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {investigations.map((inv) => (
              <button
                key={inv.id}
                onClick={() => router.push(`/investigations/${inv.id}`)}
                className="group relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-5 text-left shadow-lg transition-transform hover:scale-[1.01] hover:bg-app-card-hover"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-medium', severityPill[inv.signal.severity])}>
                    {inv.signal.severity}
                  </span>
                  <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-medium', statusPill[inv.status])}>
                    {fmtStatus(inv.status)}
                  </span>
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold">{inv.signal.title}</h3>
                <p className="mt-2 font-mono text-[10px] text-zinc-600">
                  {inv.graph.nodes.length} entities · {inv.hypotheses.filter((h) => h.status === 'confirmed').length} confirmed
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                  Open <ArrowRight size={13} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
