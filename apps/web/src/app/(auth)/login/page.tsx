'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthButton, AuthField, AuthHeading, AuthPasswordField } from '../../../components/auth/fields';
import { useAuth } from '../../../components/auth/AuthProvider';
import { DEMO_CREDENTIALS } from '../../../lib/auth';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = isEmailValid && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!isValid) {
      setTouched({ email: true, password: true });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      router.replace(search.get('next') || '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <AuthHeading title="Welcome back" subtitle="Sign in to your SOC workspace" />

      <div className="flex flex-col gap-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={touched.email && !isEmailValid ? 'Enter a valid email address' : ''}
          autoComplete="email"
          placeholder="you@company.com"
        />
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={touched.password && password.length === 0 ? 'Password is required' : ''}
          autoComplete="current-password"
          placeholder="••••••••"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <AuthButton disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</AuthButton>

      <button
        type="button"
        onClick={fillDemo}
        className="rounded-lg border border-app-border bg-app-card px-3 py-2 text-xs text-muted transition-colors hover:bg-app-card-hover hover:text-white"
      >
        Use demo account — {DEMO_CREDENTIALS.email}
      </button>

      <p className="text-center text-sm text-muted">
        New to Synt?{' '}
        <Link href="/register" className="font-medium text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
