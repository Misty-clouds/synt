import Link from 'next/link';

export function Wordmark({ sub }: { sub?: string }) {
  return (
    <Link href="/" className="flex items-baseline gap-2 select-none">
      <span className="text-lg font-bold tracking-tight">
        synt<span className="text-brand">.</span>
      </span>
      <span className="text-xs text-zinc-500">{sub ?? 'Autonomous SOC Analyst'}</span>
    </Link>
  );
}
