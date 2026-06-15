'use client';

import { cx } from '../lib/ui';
import { Sidebar } from './Sidebar';
import { useSidebar } from './SidebarContext';

/** Renders the collapsible sidebar and offsets page content to match its width. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <>
      <Sidebar />
      <div className={cx('min-h-screen transition-all duration-300 ease-in-out', collapsed ? 'pl-[68px]' : 'pl-64')}>
        {children}
      </div>
    </>
  );
}
