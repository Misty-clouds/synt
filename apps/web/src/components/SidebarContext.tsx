'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Remember the collapsed preference across navigations/reloads.
  useEffect(() => {
    const saved = localStorage.getItem('synt:sidebar-collapsed');
    if (saved) setCollapsed(saved === '1');
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('synt:sidebar-collapsed', next ? '1' : '0');
      return next;
    });

  return (
    <SidebarContext.Provider value={{ collapsed, toggleCollapsed }}>{children}</SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
