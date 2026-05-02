import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const LOGIN_ROUTE = "/login";
const PROTECTED_MATCHERS = [
  "/yugioh/my-collection",
  "/yugioh/test-page",
];
const AUTH_STATE_COOKIE = "auth_state";
const TOKEN_COOKIE = "token";
const AUTH_USER_HEADER = "x-authenticated-user";
const NONCE_HEADER = "x-nonce";
const CSP_HEADER = "Content-Security-Policy";
const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET;

const createNonce = (): string => btoa( crypto.randomUUID() );

const buildContentSecurityPolicy = ( nonce: string ): string => {
  const isDev = process.env.NODE_ENV === "development";
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${ nonce }' 'strict-dynamic'${ isDev ? " 'unsafe-eval'" : "" } https://va.vercel-scripts.com;
    style-src 'self' 'nonce-${ nonce }'${ isDev ? " 'unsafe-inline'" : "" };
    style-src-elem 'self' 'nonce-${ nonce }';
    style-src-attr 'unsafe-inline';
    img-src 'self' blob: data: https://images.ygoprodeck.com https://images.unsplash.com https://tailwindcss.com https://raw.githubusercontent.com;
    font-src 'self' data:;
    connect-src 'self'${ isDev ? " ws: wss:" : "" } https://mpapi.tcgplayer.com https://infinite-api.tcgplayer.com https://db.ygoprodeck.com https://www.sportscardspro.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;

  return cspHeader.replace( /\s{2,}/g, " " ).trim();
};

const clearAuthCookies = ( response: NextResponse ) => {
  response.cookies.set( {
    name: TOKEN_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: isProduction,
    httpOnly: true,
  } );
  response.cookies.set( {
    name: AUTH_STATE_COOKIE,
    value: "",
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: isProduction,
    httpOnly: false,
  } );
};

const isProtectedPath = ( pathname: string ): boolean =>
  PROTECTED_MATCHERS.some(
    ( route ) => pathname === route || pathname.startsWith( `${ route }/` ),
  );

const collectReturnPath = ( request: NextRequest ): string => {
  const target = request.nextUrl.pathname + request.nextUrl.search;
  return target === LOGIN_ROUTE ? "/" : target;
};

const extractBearerToken = ( headerValue: string | null ): string | null => {
  if ( !headerValue ) {
    return null;
  }

  const [ scheme, value ] = headerValue.split( " " );
  if ( scheme?.toLowerCase() !== "bearer" || !value ) {
    return null;
  }

  return value.trim();
};

const getTokenFromRequest = ( request: NextRequest ): string | null => {
  const headerToken = extractBearerToken( request.headers.get( "authorization" ) );
  if ( headerToken ) {
    return headerToken;
  }

  return request.cookies.get( TOKEN_COOKIE )?.value ?? null;
};

type AuthenticatedUser = {
  userId: string;
  username: string;
};

const parseAuthenticatedUser = ( decoded: unknown ): AuthenticatedUser | null => {
  if ( !decoded || typeof decoded !== "object" ) {
    return null;
  }

  const { userId, username } = decoded as { userId?: unknown; username?: unknown; };
  if ( !userId || !username ) {
    return null;
  }

  return {
    userId: String( userId ),
    username: String( username ),
  };
};

const getAuthenticatedUser = ( request: NextRequest ): AuthenticatedUser | null => {
  const token = getTokenFromRequest( request );
  if ( !token || !jwtSecret ) {
    return null;
  }

  try {
    const decoded = jwt.verify( token, jwtSecret );
    return parseAuthenticatedUser( decoded );
  } catch ( error ) {
    return null;
  }
};

const buildRequestHeaders = (
  request: NextRequest,
  authenticatedUser: AuthenticatedUser | null,
  nonce?: string,
  contentSecurityPolicy?: string,
): Headers => {
  const requestHeaders = new Headers( request.headers );
  requestHeaders.delete( AUTH_USER_HEADER );

  if ( authenticatedUser ) {
    requestHeaders.set( AUTH_USER_HEADER, JSON.stringify( authenticatedUser ) );
  }

  if ( nonce && contentSecurityPolicy ) {
    requestHeaders.set( NONCE_HEADER, nonce );
    requestHeaders.set( CSP_HEADER, contentSecurityPolicy );
  }

  return requestHeaders;
};

const withContentSecurityPolicy = (
  response: NextResponse,
  contentSecurityPolicy?: string,
): NextResponse => {
  if ( contentSecurityPolicy ) {
    response.headers.set( CSP_HEADER, contentSecurityPolicy );
  }

  return response;
};

const handleUnauthorized = ( request: NextRequest ) => {
  if ( request.nextUrl.pathname.startsWith( "/api/" ) ) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    clearAuthCookies( response );
    return response;
  }

  const redirectUrl = new URL( LOGIN_ROUTE, request.url );
  const returnPath = collectReturnPath( request );
  if ( returnPath ) {
    const encodedReturnPath = encodeURIComponent( returnPath ).replace( /%2F/gi, "/" );
    redirectUrl.search = `?from=${ encodedReturnPath }`;
  }

  const response = NextResponse.redirect( redirectUrl );
  clearAuthCookies( response );
  return response;
};

export function proxy( request: NextRequest ) {
  const { pathname } = request.nextUrl;
  const isApiPath = pathname.startsWith( "/api/" );
  const isYugiohApiPath = pathname.startsWith( "/api/Yugioh/" );
  const shouldApplyContentSecurityPolicy = !isApiPath;
  const nonce = shouldApplyContentSecurityPolicy ? createNonce() : undefined;
  const contentSecurityPolicy = nonce
    ? buildContentSecurityPolicy( nonce )
    : undefined;

  const needsAuthenticatedUser = isProtectedPath( pathname ) || isYugiohApiPath;
  const authenticatedUser = needsAuthenticatedUser ? getAuthenticatedUser( request ) : null;
  const requestHeaders = buildRequestHeaders(
    request,
    authenticatedUser,
    nonce,
    contentSecurityPolicy,
  );
  const allowRequest = () =>
    withContentSecurityPolicy(
      NextResponse.next( {
        request: {
          headers: requestHeaders,
        },
      } ),
      contentSecurityPolicy,
    );

  if ( !isProtectedPath( pathname ) && !isYugiohApiPath ) {
    return allowRequest();
  }

  if ( request.method === "OPTIONS" ) {
    return allowRequest();
  }

  if ( isYugiohApiPath ) {
    return allowRequest();
  }

  if ( authenticatedUser ) {
    return allowRequest();
  }

  return withContentSecurityPolicy(
    handleUnauthorized( request ),
    contentSecurityPolicy,
  );
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|next.svg|vercel.svg|images/|backgrounds/|icons/|yugioh-parallax/|yugioh-dragon-bg/|card-data/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    "/api/Yugioh/:path*",
  ]
};
