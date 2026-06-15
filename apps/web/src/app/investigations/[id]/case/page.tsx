'use client';

import type { CaseFile } from '@synt/shared';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CaseFileView } from '../../../../components/CaseFileView';
import { Wordmark } from '../../../../components/Wordmark';
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
        <Link href={`/investigations/${id}`} className="text-zinc-500 transition-colors hover:text-white">
          <ArrowLeft size={18} />
        </Link>
        <Wordmark sub="Case file" />
      </header>
      <div className="mx-auto max-w-3xl p-8">
        {err && <p className="text-sm text-zinc-500">No case file is available for this investigation yet.</p>}
        {caseFile ? <CaseFileView caseFile={caseFile} /> : !err && <p className="text-sm text-zinc-500">Loading…</p>}
      </div>
    </div>
  );
}
