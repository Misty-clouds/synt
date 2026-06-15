'use client';

import { ArrowUp, Loader2, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '../lib/api';

/**
 * Floating ChatGPT-style command bar. Rendered as an absolute overlay inside a
 * `relative` parent (the graph panel) so the surrounding columns keep full height.
 */
export function NlCommandBox({ investigationId }: { investigationId: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await api.command(investigationId, t);
      setText('');
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const canSend = !!text.trim() && !busy;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-1.5 bg-gradient-to-t from-app-surface via-app-surface/85 to-transparent px-4 pb-5 pt-16">
      <div className="pointer-events-auto w-full max-w-xl">
        <div className="flex items-center gap-2 rounded-full border border-app-border bg-app-card-alt/90 py-2 pl-2 pr-2 shadow-2xl backdrop-blur-md transition-colors focus-within:border-zinc-600">
          <button
            type="button"
            onClick={() => inputRef.current?.focus()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-app-card-hover hover:text-white"
            title="Steer the investigation"
          >
            <Plus size={18} />
          </button>

          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Steer the investigation…"
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-dim focus:outline-none"
          />

          <button
            onClick={submit}
            disabled={!canSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-all hover:bg-brand/90 disabled:bg-app-card disabled:text-faint"
            title="Send"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={17} strokeWidth={2.4} />}
          </button>
        </div>
      </div>
      <p className="pointer-events-none text-center text-[11px] text-faint">
        Synt can re-pivot the live investigation — your directive runs as a new Splunk query.
      </p>
    </div>
  );
}
