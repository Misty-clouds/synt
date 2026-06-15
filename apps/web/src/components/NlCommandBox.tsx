'use client';

import { CornerDownLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { api } from '../lib/api';

export function NlCommandBox({ investigationId }: { investigationId: string }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await api.command(investigationId, t);
      setText('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2 border-t border-app-border bg-app-surface px-3 py-2.5">
      <Sparkles size={15} className="shrink-0 text-brand" />
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="Steer the investigation — e.g. “re-check assuming svc-backup is compromised”"
        className="flex-1 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={busy || !text.trim()}
        className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-40"
      >
        {busy ? 'Thinking…' : 'Send'}
        <CornerDownLeft size={13} />
      </button>
    </div>
  );
}
