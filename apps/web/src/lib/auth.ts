'use client';

/**
 * Lightweight client-side auth for the Synt demo.
 *
 * Synt's NestJS service is the agent runtime, not a user backend, so accounts live
 * locally: registered users in localStorage (passwords SHA-256 hashed), the current
 * session mirrored to a non-sensitive `synt_authed` cookie so Next.js middleware can
 * gate routes on the edge (it can't read localStorage). Swap these functions for real
 * API calls to make it production auth — the AuthProvider/middleware contract is the same.
 */

export const AUTH_COOKIE = 'synt_authed';
const SESSION_KEY = 'synt_session';
const USERS_KEY = 'synt_users';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SyntUser {
  name: string;
  email: string;
}

interface StoredUser extends SyntUser {
  passwordHash: string;
}

// passwordHash is filled in by ensureDemoUser() (hashed from DEMO_CREDENTIALS).
const DEMO: SyntUser = { name: 'SOC Analyst', email: 'analyst@synt.security' };

export const DEMO_CREDENTIALS = { email: DEMO.email, password: 'synt1234' };

async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(`synt:${pw}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function readUsers(): Record<string, StoredUser> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

/** Seed a ready-to-use demo account so reviewers can sign in immediately. */
export async function ensureDemoUser(): Promise<void> {
  if (typeof window === 'undefined') return;
  const users = readUsers();
  if (!users[DEMO.email]) {
    users[DEMO.email] = { ...DEMO, passwordHash: await hashPassword(DEMO_CREDENTIALS.password) };
    writeUsers(users);
  }
}

function setSession(user: SyntUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function getSession(): SyntUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SyntUser) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

export async function login(email: string, password: string): Promise<SyntUser> {
  await ensureDemoUser();
  const users = readUsers();
  const user = users[email.toLowerCase().trim()];
  if (!user) throw new Error('No account found for that email');
  if (user.passwordHash !== (await hashPassword(password))) throw new Error('Incorrect password');
  const session = { name: user.name, email: user.email };
  setSession(session);
  return session;
}

export async function register(name: string, email: string, password: string): Promise<SyntUser> {
  const key = email.toLowerCase().trim();
  const users = readUsers();
  if (users[key]) throw new Error('An account with that email already exists');
  const user: StoredUser = { name: name.trim(), email: key, passwordHash: await hashPassword(password) };
  users[key] = user;
  writeUsers(users);
  const session = { name: user.name, email: user.email };
  setSession(session);
  return session;
}

export function logout(): void {
  clearSession();
}
