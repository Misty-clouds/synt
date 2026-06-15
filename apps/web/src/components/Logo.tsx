import Link from 'next/link';

/** Synt mark — a gradient rounded square with the wordmark, premium Suite-style. */
export function Logo({ size = 30, showText = false, href = '/' as string | null, sub }: {
  size?: number;
  showText?: boolean;
  href?: string | null;
  sub?: string;
}) {
  const mark = (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        className="grid shrink-0 place-items-center rounded-[10px] bg-gradient-to-b from-[#0a6dff] to-[#0042c8] font-bold text-white shadow-[0_2px_10px_-2px_rgba(0,85,255,0.6)]"
        style={{ height: size, width: size, fontSize: Math.round(size * 0.52) }}
      >
        S
      </span>
      {showText && (
        <span className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-white">synt</span>
          {sub && <span className="text-xs text-dim">{sub}</span>}
        </span>
      )}
    </span>
  );

  if (href === null) return mark;
  return (
    <Link href={href} className="transition-opacity hover:opacity-80">
      {mark}
    </Link>
  );
}
