'use client';

import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Radar,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cx } from '../lib/ui';
import { useSidebar } from './SidebarContext';

interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  match: (path: string) => boolean;
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard, href: '/', match: (p) => p === '/' },
      {
        name: 'Investigations',
        icon: ShieldAlert,
        href: '/investigations',
        match: (p) => p.startsWith('/investigations'),
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={cx(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-app-border bg-app-bg py-6 transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px] px-2' : 'w-64 px-4',
      )}
    >
      {/* Logo + collapse toggle */}
      <div className={cx('mb-8 flex items-center px-1', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <Link href="/" className="flex items-baseline gap-1 select-none">
            <span className="text-lg font-bold tracking-tight">synt</span>
            <span className="text-brand text-lg font-bold leading-none">.</span>
          </Link>
        )}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cx(
            'flex h-8 w-8 items-center justify-center rounded-lg border border-app-border bg-app-card text-zinc-400 transition-all duration-200 hover:border-zinc-600 hover:bg-app-card-hover hover:text-white',
            collapsed ? 'mx-auto' : 'ml-auto',
          )}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-8 overflow-y-auto">
        {SECTIONS.map((section) => (
          <div key={section.title}>
            {!collapsed ? (
              <h3 className="mb-3 px-2 text-xs font-semibold tracking-wider text-zinc-500">{section.title}</h3>
            ) : (
              <div className="mb-3 h-px bg-app-border" />
            )}
            <ul className={cx('space-y-1', collapsed && 'flex flex-col items-center')}>
              {section.items.map((item) => {
                const isActive = item.match(pathname);
                return (
                  <li key={item.name} className={collapsed ? 'flex w-full justify-center' : ''}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.name : undefined}
                      className={cx(
                        'group flex items-center rounded-lg transition-colors',
                        collapsed ? 'h-10 w-10 justify-center' : 'w-full gap-3 px-2 py-2 text-sm font-medium',
                        isActive
                          ? 'bg-app-card text-white shadow-inner shadow-white/5'
                          : 'text-zinc-400 hover:bg-app-card hover:text-white',
                      )}
                    >
                      <item.icon
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? 'text-brand' : 'text-zinc-500 group-hover:text-white'}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — live status */}
      <div className="mt-auto border-t border-app-border pt-4">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg bg-app-card p-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-medium text-white">Agent online</span>
              <span className="truncate text-[11px] text-zinc-500">watching Splunk notables</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Agent online">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-card">
              <Radar size={16} className="text-green-500" />
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
