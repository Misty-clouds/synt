'use client';

import { LayoutDashboard, LogOut, ShieldAlert, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cx } from '../lib/ui';
import { useAuth } from './auth/AuthProvider';
import { Logo } from './Logo';

interface NavItem {
  name: string;
  icon: LucideIcon;
  href: string;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', match: (p) => p === '/dashboard' },
  { name: 'Investigations', icon: ShieldAlert, href: '/investigations', match: (p) => p.startsWith('/investigations') },
];

/** Permanent collapsed icon rail (68px). */
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function signOut() {
    logout();
    router.replace('/');
  }

  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[68px] flex-col items-center border-r border-app-border bg-app-bg px-2 py-5">
      <Logo size={34} href="/dashboard" />

      <div className="mt-7 mb-4 h-px w-8 bg-app-border" />

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

      {/* Footer — user + sign out */}
      <div className="flex flex-col items-center gap-2">
        <div
          title={user?.email ?? 'Account'}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#0a6dff] to-[#0042c8] text-sm font-bold text-white"
        >
          {initial}
        </div>
        <button
          onClick={signOut}
          title="Sign out"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-dim transition-colors hover:bg-app-card hover:text-red-400"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
