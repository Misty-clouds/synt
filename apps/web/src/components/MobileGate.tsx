import { Monitor } from 'lucide-react';

/** PRD §11.3 — below lg, show only this; the app shell is hidden. */
export function MobileGate() {
  return (
    <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center bg-app-bg p-6">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-app-border bg-app-card p-8 text-center shadow-lg">
        <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Monitor size={26} />
        </div>
        <h1 className="mb-2 text-lg font-bold tracking-tight">Synt is built for the big screen.</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          Open this on a laptop or desktop to watch investigations unfold.
        </p>
        <p className="mt-3 text-xs italic text-zinc-500">Mobile view isn&apos;t available yet.</p>
      </div>
    </div>
  );
}
