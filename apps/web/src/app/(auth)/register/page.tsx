'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthButton, AuthField, AuthHeading, AuthPasswordField } from '../../../components/auth/fields';
import { useAuth } from '../../../components/auth/AuthProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValid = name.trim().length > 1 && isEmailValid && password.length >= 6;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!isValid) {
      setTouched({ name: true, email: true, password: true });
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await register(name, email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <AuthHeading title="Create your account" subtitle="Spin up your autonomous SOC workspace" />

      <div className="flex flex-col gap-4">
        <AuthField
          id="name"
          label="Full name"
          value={name}
          onChange={setName}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          error={touched.name && name.trim().length <= 1 ? 'Enter your name' : ''}
          autoComplete="name"
          placeholder="Ada Analyst"
        />
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
          error={touched.password && password.length < 6 ? 'At least 6 characters' : ''}
          autoComplete="new-password"
          placeholder="••••••••"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      <AuthButton disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</AuthButton>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
