import { Logo } from '@/components/Logo';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  GitBranch,
  Hand,
  Repeat,
  Search,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-app-bg text-white">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-app-border/60 bg-app-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Logo size={32} showText href="/" />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(0,85,255,0.6)] transition-colors hover:bg-brand/90"
            >
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-card px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Splunk Agentic Ops · Security
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
            Your autonomous
            <br />
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#0055ff] bg-clip-text text-transparent">
              SOC analyst.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Synt wakes when Splunk flags something wrong, investigates like a senior analyst — forming
            hypotheses, querying Splunk, pivoting across entities — and hands you a finished, MITRE-mapped
            case file with a one-click response.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,85,255,0.6)] transition-transform hover:scale-[1.02]"
            >
              Get started free <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-app-border bg-app-card px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-app-card-hover"
            >
              Sign in
            </Link>
          </div>

          {/* Theatre preview mock */}
          <div className="mx-auto mt-14 max-w-3xl overflow-hidden rounded-2xl border border-app-border bg-app-surface text-left shadow-2xl">
            <div className="flex items-center gap-2 border-b border-app-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#3a3a3a]" />
              <span className="ml-2 text-xs text-dim">Reasoning Theatre — credential stuffing</span>
              <span className="ml-auto rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-500">
                98% confidence
              </span>
            </div>
            <div className="space-y-2 p-4">
              <PreviewLine icon={Terminal} mono text="index=synt_auth action=failure | stats count by src_ip, user" />
              <PreviewLine icon={Search} text="Query returned 480 events" />
              <PreviewLine icon={CheckCircle2} tone="text-green-500" text="Confirmed (98%): distributed credential stuffing" />
              <PreviewLine icon={GitBranch} tone="text-brand" text="Pivot → account takeover on j.okafor, MFA changed" />
              <PreviewLine icon={ShieldCheck} tone="text-green-500" text="Case file ready · disable_user · block_ip · revoke_sessions" />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="border-y border-app-border bg-app-surface/50">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4">
          <Metric value="200 → 3" label="alerts to case files" />
          <Metric value="< 3s" label="mean time to case file" />
          <Metric value="4" label="attack classes covered" />
          <Metric value="100%" label="MITRE ATT&CK mapped" />
        </div>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight">An agent with a brain, hands, and a method.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">Built on Splunk — its data, its tools, its models.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Capability
            icon={Brain}
            title="Hosted models — the brain"
            body="Splunk hosted models generate ranked hypotheses, translate questions to SPL, write the narrative, and map findings to MITRE ATT&CK."
          />
          <Capability
            icon={Hand}
            title="MCP Server — the hands"
            body="Every Splunk search and response action runs through the Splunk MCP Server, so the agent really queries your data and really contains threats."
          />
          <Capability
            icon={Repeat}
            title="OODA loop — the method"
            body="Observe, orient, decide, act — the agent forms a hypothesis, tests it against Splunk, updates its belief, and pivots until it reaches the truth."
          />
        </div>
      </section>

      {/* Scenarios */}
      <section className="border-t border-app-border bg-app-surface/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">It generalizes across the kill chain.</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Four attack classes — from fast autonomous containment to careful human-gated judgement.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Scenario sev="high" tags="T1110.004 · T1078" title="Credential Stuffing → Account Takeover" body="Detects the spray, the single success from a new geo, and the attacker's MFA change." />
            <Scenario sev="high" tags="T1530 · T1567" title="Insider Data Exfiltration" body="Authorized-but-anomalous off-hours access, staged, then uploaded — flagged for a human." />
            <Scenario sev="critical" tags="T1021 · T1136" title="Lateral Movement" body="Traces a beachhead fanning out over SMB/RDP and a new admin account downstream." />
            <Scenario sev="critical" tags="T1490 · T1486" title="Ransomware Staging" body="Shadow-copy deletion, mass encryption, C2 beaconing — auto-isolated before detonation." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          From 200 raw alerts to <span className="text-brand">3 closed case files.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Promote your analysts from triage to reviewing an AI&apos;s completed investigation.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,85,255,0.6)] transition-transform hover:scale-[1.02]"
        >
          Get started free <ArrowRight size={16} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-app-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-dim sm:flex-row">
          <Logo size={26} showText href="/" />
          <p>Splunk Agentic Ops Hackathon · Security track · MIT licensed</p>
        </div>
      </footer>
    </div>
  );
}

function PreviewLine({ icon: Icon, text, tone = 'text-muted', mono }: { icon: typeof Search; text: string; tone?: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-app-border bg-app-card px-3 py-2">
      <Icon size={14} className={`shrink-0 ${tone}`} />
      <span className={`truncate text-xs ${mono ? 'font-mono text-brand' : 'text-zinc-300'}`}>{text}</span>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-dim">{label}</p>
    </div>
  );
}

function Capability({ icon: Icon, title, body }: { icon: typeof Brain; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-app-border bg-app-card p-6 shadow-lg transition-transform hover:scale-[1.01]">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon size={20} />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Scenario({ sev, tags, title, body }: { sev: 'high' | 'critical'; tags: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-app-border bg-app-card p-6 shadow-lg transition-transform hover:scale-[1.01]">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            sev === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'
          }`}
        >
          {sev}
        </span>
        <span className="font-mono text-[10px] text-dim">{tags}</span>
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}
