import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/aprovacoes', '/fornecedores', '/usuarios'];
const AUTH_ONLY = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = request.cookies.has('obraja_admin_has_token');

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
    '/aprovacoes/:path*',
    '/fornecedores/:path*',
    '/usuarios/:path*',
    '/login',
  ],
};
