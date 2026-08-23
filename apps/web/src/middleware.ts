import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function decodeJwtPayload(token: string): { sub?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const payload = token ? decodeJwtPayload(token) : null;
  const isAuthenticated = !!(payload && payload.exp && payload.exp * 1000 > Date.now());
  const userRole = isAuthenticated ? payload?.role : null;

  // 1. Admin route protection: /admin/*
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'admin') {
      // Candidate attempting to access admin route
      return NextResponse.redirect(new URL('/jobs', request.url));
    }
  }

  // 2. Candidate protected routes: /apply/*, /applications, /profile
  const isCandidateRoute =
    pathname.startsWith('/apply') ||
    pathname.startsWith('/applications') ||
    pathname.startsWith('/profile');

  if (isCandidateRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Guest-only auth pages: /login, /register (redirect if already logged in)
  const isGuestAuthRoute = pathname === '/login' || pathname === '/register';
  if (isGuestAuthRoute && isAuthenticated) {
    const nextParam = request.nextUrl.searchParams.get('next');
    if (nextParam) {
      return NextResponse.redirect(new URL(nextParam, request.url));
    }
    if (userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/jobs', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/apply/:path*',
    '/applications/:path*',
    '/profile/:path*',
    '/login',
    '/register',
  ],
};
