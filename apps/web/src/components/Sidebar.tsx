'use client';

import { LayoutDashboard, Radar, ShieldAlert, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '../lib/ui';
import { Logo } from './Logo';

interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/', match: (p) => p === '/' },
  { name: 'Investigations', icon: ShieldAlert, href: '/investigations', match: (p) => p.startsWith('/investigations') },
];

/** Permanent collapsed icon rail (68px). */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[68px] flex-col items-center border-r border-app-border bg-app-bg px-2 py-5">
      {/* Logo mark → home */}
      <Logo size={34} />

      <div className="mt-7 mb-4 h-px w-8 bg-app-border" />

      {/* Nav icons */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {NAV.map((item) => {
          const isActive = item.match(pathname);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={cx(
                'group flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                isActive
                  ? 'bg-app-card text-white shadow-inner shadow-white/5'
                  : 'text-faint hover:bg-app-card hover:text-white',
              )}
            >
              <item.icon
                size={19}
                strokeWidth={isActive ? 2.4 : 2}
                className={isActive ? 'text-brand' : 'text-dim group-hover:text-white'}
              />
            </Link>
          );
        })}
      </nav>

      {/* Footer — agent status */}
      <div
        title="Agent online — watching Splunk notables"
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-app-border bg-app-card"
      >
        <Radar size={17} className="synt-pulse text-green-500" />
      </div>
    </aside>
  );
}
