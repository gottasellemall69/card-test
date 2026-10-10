import { randomBytes } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { verifySession } from '@/lib/server/session';

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString('base64');
  const development = process.env.NODE_ENV === 'development';
  const policy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${nonce}'${development ? " 'unsafe-eval'" : ''} https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.ygoprodeck.com https://images.unsplash.com https://tailwindcss.com https://raw.githubusercontent.com",
    "font-src 'self' data:",
    `connect-src 'self'${development ? ' ws: wss:' : ''} https://vitals.vercel-insights.com`,
    "worker-src 'self' blob:",
    "media-src 'self' blob: data:",
    ...(request.nextUrl.protocol === 'https:' ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
  const headers = new Headers(request.headers);
  headers.delete('x-authenticated-user');
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const protectedPage = ['/yugioh/my-collection', '/yugioh/test-page'].some(
    (path) => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`),
  );
  let response;
  if (protectedPage && !verifySession(request.cookies.get('token')?.value)) {
    const login = new URL('/login', request.url);
    login.searchParams.set('from', request.nextUrl.pathname + request.nextUrl.search);
    response = NextResponse.redirect(login);
  } else response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = {
  matcher: [
    '/((?!api/|_next/|favicon.ico|robots.txt|images/|backgrounds/|icons/|yugioh-parallax/|yugioh-dragon-bg/|card-data/).*)',
  ],
};
