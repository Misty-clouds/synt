import { CheckCircle2, GitBranch, Search, Terminal } from 'lucide-react';
import { Logo } from '../Logo';

/** Split auth card: form on the left, a branded "reasoning" preview on the right. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-app-bg p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-2xl md:grid-cols-2">
        {/* Form */}
        <div className="flex flex-col justify-center px-7 py-12 sm:px-10">
          <div className="mb-8">
            <Logo size={34} showText href="/" />
          </div>
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Preview */}
        <div className="relative hidden overflow-hidden border-l border-app-border bg-gradient-to-br from-[#0b1426] via-app-card to-app-bg p-8 md:flex md:flex-col md:justify-center">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
          <div className="relative">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-brand">Reasoning Theatre</p>
            <h2 className="mb-6 text-xl font-bold leading-snug text-white">
              Watch an AI analyst investigate — live.
            </h2>
            <div className="space-y-2.5">
              <PreviewLine icon={Terminal} text="index=synt_auth action=failure | stats count" tone="text-brand" mono />
              <PreviewLine icon={Search} text="480 events corroborate this hypothesis" />
              <PreviewLine icon={CheckCircle2} text="Confirmed (98%): credential stuffing" tone="text-green-500" />
              <PreviewLine icon={GitBranch} text="Pivot → account takeover on j.okafor" tone="text-brand" />
              <PreviewLine icon={CheckCircle2} text="Case file ready · MITRE T1110.004" tone="text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewLine({
  icon: Icon,
  text,
  tone = 'text-muted',
  mono,
}: {
  icon: typeof Search;
  text: string;
  tone?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-app-border bg-app-card/60 px-3 py-2 backdrop-blur">
      <Icon size={14} className={`shrink-0 ${tone}`} />
      <span className={`truncate text-xs ${mono ? 'font-mono text-brand' : 'text-zinc-300'}`}>{text}</span>
    </div>
  );
}
