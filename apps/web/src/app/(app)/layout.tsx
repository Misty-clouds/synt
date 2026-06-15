import { AppShell } from '@/components/AppShell';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { MobileGate } from '@/components/MobileGate';

/** Authenticated app shell: desktop-only, sidebar, guarded by the session. */
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <MobileGate />
      <div className="hidden lg:block">
        <AppShell>{children}</AppShell>
      </div>
    </RequireAuth>
  );
}
