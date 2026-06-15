import { Sidebar } from './Sidebar';

/** Renders the fixed collapsed sidebar and offsets page content to match its width. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="min-h-screen pl-[68px]">{children}</div>
    </>
  );
}
