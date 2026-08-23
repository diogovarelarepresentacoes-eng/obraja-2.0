import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/produtos', '/pedidos', '/perfil'];
const AUTH_ONLY = ['/login', '/cadastro'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('obraja_supplier_has_token');

  if (PROTECTED.some((p) => pathname.startsWith(p)) && !hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (AUTH_ONLY.some((p) => pathname === p) && hasToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/produtos/:path*',
    '/pedidos/:path*',
    '/perfil/:path*',
    '/login',
    '/cadastro',
  ],
};
