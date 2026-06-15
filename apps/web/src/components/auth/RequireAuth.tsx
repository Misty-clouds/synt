'use client';

import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';

/**
 * Client-side guard for the authenticated app. Middleware is the primary gate
 * (server/edge); this prevents any flash of protected content during SPA navigation.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <Loader2 className="animate-spin text-brand" size={26} />
      </div>
    );
  }
  return <>{children}</>;
}
