import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'synt_authed';

// Reachable without a session. Everything else requires auth.
const PUBLIC_PATHS = ['/', '/login', '/register'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isAuthed = req.cookies.has(AUTH_COOKIE);

  // Block protected routes (dashboard, investigations) without a session.
  if (!isAuthed && !isPublic(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Keep signed-in users out of the auth screens → send them to the dashboard.
  if (isAuthed && (pathname === '/login' || pathname === '/register')) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
