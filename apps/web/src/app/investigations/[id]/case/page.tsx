'use client';

import type { CaseFile } from '@synt/shared';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CaseFileView } from '../../../../components/CaseFileView';
import { Logo } from '../../../../components/Logo';
import { api } from '../../../../lib/api';

export default function CasePage() {
  const id = useParams().id as string;
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.caseFile(id).then(setCaseFile).catch(() => setErr(true));
  }, [id]);

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-4 border-b border-app-border px-6 py-3">
        <Logo size={30} showText sub="Case file" href={`/investigations/${id}`} />
      </header>
      <div className="mx-auto max-w-3xl p-8">
        {err && <p className="text-sm text-dim">No case file is available for this investigation yet.</p>}
        {caseFile ? <CaseFileView caseFile={caseFile} /> : !err && <p className="text-sm text-dim">Loading…</p>}
      </div>
    </div>
  );
}
