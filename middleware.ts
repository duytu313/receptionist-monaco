import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for login page and static files
  if (request.nextUrl.pathname.startsWith('/admin/login') || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/favicon.ico')) {
    return NextResponse.next();
  }

  // Note: Firebase Auth is client-side only, so we cannot check auth state in middleware.
  // Authentication is handled client-side by the page components and hooks.
  // The useBookingData hook will handle anonymous sign-in for public pages.
  // Admin pages should implement their own client-side auth checks.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - admin/login (login page)
     */
    '/((?!_next/static|_next/image|favicon.ico|admin/login).*)',
  ],
};