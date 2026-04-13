import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /staff/* routes except /staff/login
  if (pathname.startsWith('/staff/') && !pathname.startsWith('/staff/login')) {
    const refreshToken = request.cookies.get('staff_auth');
    if (!refreshToken) {
      return NextResponse.redirect(new URL('/staff/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/staff/:path*'],
};
