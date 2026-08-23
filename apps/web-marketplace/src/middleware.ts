import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/meus-pedidos', '/checkout', '/conta'];
const AUTH_ONLY = ['/login', '/cadastro'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('obraja_has_token');

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasToken) {
    const url = new URL('/login', request.url);
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_ONLY.some((p) => pathname === p) && hasToken) {
    return NextResponse.redirect(new URL('/meus-pedidos', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/meus-pedidos/:path*',
    '/checkout/:path*',
    '/conta/:path*',
    '/login',
    '/cadastro',
  ],
};
