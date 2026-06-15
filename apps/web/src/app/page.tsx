'use client';

import type { Investigation } from '@synt/shared';
import { Activity, AlertTriangle, ArrowRight, CheckCircle2, Clock, Loader2, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Wordmark } from '../components/Wordmark';
import { api, type ScenarioMeta } from '../lib/api';
import { cx, fmtStatus, severityPill, statusPill } from '../lib/ui';

export default function Dashboard() {
  const router = useRouter();
  const [scenarios, setScenarios] = useState<ScenarioMeta[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [injecting, setInjecting] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.scenarios().then(setScenarios).catch((e) => setErr(String(e)));
    const tick = () => api.investigations().then(setInvestigations).catch(() => {});
    tick();
    const t = setInterval(tick, 2000);
    return () => clearInterval(t);
  }, []);

  async function inject(id: string) {
    setInjecting(id);
    setErr(null);
    try {
      const inv = await api.inject(id);
      router.push(`/investigations/${inv.id}`);
    } catch (e) {
      setErr(`Could not reach the API at ${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}. Is it running?`);
      setInjecting(null);
    }
  }

  const active = investigations.filter((i) => i.status === 'investigating' || i.status === 'queued').length;
  const critical = investigations.filter((i) => i.signal.severity === 'critical' && i.status !== 'dismissed').length;
  const closed = investigations.filter((i) => i.status === 'responded' || i.status === 'awaiting_approval' || i.status === 'completed').length;
  const mttc = meanTimeToCaseFile(investigations);

  return (
    <div className="grid min-h-screen grid-cols-[1fr_340px]">
      {/* Main */}
      <main className="border-r border-app-border">
        <header className="flex items-center justify-between border-b border-app-border px-8 py-5">
          <Wordmark />
          <span className="flex items-center gap-2 rounded-full border border-app-border px-3 py-1 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-green-500" /> live
          </span>
        </header>

        <div className="space-y-8 p-8">
          {/* Stat row */}
          <div className="grid grid-cols-4 gap-4">
            <Stat icon={Loader2} label="Active investigations" value={active} />
            <Stat icon={AlertTriangle} label="Critical open" value={critical} tone="text-red-500" />
            <Stat icon={Clock} label="Mean time-to-case-file" value={mttc} />
            <Stat icon={CheckCircle2} label="Case files produced" value={closed} tone="text-green-500" />
          </div>

          {/* Scenario injectors */}
          <section>
            <h2 className="mb-1 text-sm font-semibold">Inject an attack scenario</h2>
            <p className="mb-4 text-xs text-zinc-500">
              Seeds real events into Splunk over HEC and fires an autonomous investigation.
            </p>
            {err && <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{err}</p>}
            <div className="grid grid-cols-2 gap-4">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => inject(s.id)}
                  disabled={!!injecting}
                  className="group relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-5 text-left shadow-lg transition-transform hover:scale-[1.01] hover:bg-app-card-hover disabled:opacity-60"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className={cx('rounded px-1.5 py-0.5 text-xs font-medium', severityPill[s.severity])}>
                      {s.severity}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-600">{s.mitre.map((m) => m.id).join(' · ')}</span>
                  </div>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{s.description}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
                    {injecting === s.id ? 'Launching…' : 'Investigate'} <ArrowRight size={13} />
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Right queue */}
      <aside className="bg-app-surface">
        <header className="flex items-center gap-2 border-b border-app-border px-5 py-[1.35rem]">
          <Activity size={15} className="text-brand" />
          <h2 className="text-sm font-semibold">Investigation queue</h2>
        </header>
        <div className="space-y-2 p-3">
          {investigations.length === 0 && (
            <p className="px-2 py-8 text-center text-xs text-zinc-600">
              No investigations yet. Inject a scenario to begin.
            </p>
          )}
          {investigations.map((inv) => (
            <button
              key={inv.id}
              onClick={() => router.push(`/investigations/${inv.id}`)}
              className="block w-full rounded-xl border border-app-border bg-app-card p-3.5 text-left transition-colors hover:bg-app-card-hover"
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-medium', severityPill[inv.signal.severity])}>
                  {inv.signal.severity}
                </span>
                <span className={cx('rounded px-1.5 py-0.5 text-[10px] font-medium', statusPill[inv.status])}>
                  {fmtStatus(inv.status)}
                </span>
                {inv.status === 'responded' && <Zap size={12} className="ml-auto text-green-500" />}
              </div>
              <p className="line-clamp-2 text-xs text-zinc-300">{inv.signal.title}</p>
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-5 shadow-lg">
      <Icon size={16} className={cx('mb-3', tone ?? 'text-zinc-500')} />
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function meanTimeToCaseFile(invs: Investigation[]): string {
  const done = invs.filter((i) => i.completedAt);
  if (done.length === 0) return '—';
  const avgMs =
    done.reduce((sum, i) => sum + (Date.parse(i.completedAt!) - Date.parse(i.startedAt)), 0) / done.length;
  return avgMs < 1000 ? '<1s' : `${(avgMs / 1000).toFixed(1)}s`;
}
