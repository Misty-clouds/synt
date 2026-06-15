'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ensureDemoUser,
  getSession,
  login as doLogin,
  logout as doLogout,
  register as doRegister,
  type SyntUser,
} from '../../lib/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: SyntUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SyntUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    void ensureDemoUser();
    const session = getSession();
    setUser(session);
    setStatus(session ? 'authenticated' : 'unauthenticated');
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await doLogin(email, password);
    setUser(session);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const session = await doRegister(name, email, password);
    setUser(session);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
