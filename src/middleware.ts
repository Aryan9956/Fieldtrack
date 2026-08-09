import { NextRequest, NextResponse } from 'next/server';
import { verifyJWTTokenEdge } from '@/lib/jwt-edge';

const TOKEN_NAME = 'fieldtrack_token';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(TOKEN_NAME)?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  const session = token ? await verifyJWTTokenEdge(token) : null;

  // 1. Super Admin routes protection
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session || session.role !== 'SUPER_ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // 2. Owner Dashboard routes protection
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (session.role !== 'OWNER') {
      if (session.role === 'SUPER_ADMIN') {
        const url = req.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
      if (session.role === 'EMPLOYEE') {
        const url = req.nextUrl.clone();
        url.pathname = '/employee';
        return NextResponse.redirect(url);
      }
    }

    // Email verification check
    if (!session.emailVerified) {
      const url = req.nextUrl.clone();
      url.pathname = '/verify-email';
      return NextResponse.redirect(url);
    }

    // Access Status Check
    const accessStatus = session.accessStatus || 'PENDING';
    if (accessStatus !== 'ACTIVE') {
      const url = req.nextUrl.clone();
      if (accessStatus === 'PENDING') url.pathname = '/access-pending';
      else if (accessStatus === 'EXPIRED') url.pathname = '/access-expired';
      else if (accessStatus === 'REVOKED') url.pathname = '/access-revoked';
      else if (accessStatus === 'SUSPENDED') url.pathname = '/access-suspended';
      return NextResponse.redirect(url);
    }
  }

  // 3. Employee Mobile Dashboard routes protection
  if (pathname.startsWith('/employee')) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (session.role !== 'EMPLOYEE') {
      const url = req.nextUrl.clone();
      url.pathname = session.role === 'SUPER_ADMIN' ? '/admin' : '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
