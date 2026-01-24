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
const isProduction = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET;

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

  const { userId, username } = decoded as { userId?: unknown; username?: unknown };
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
): Headers => {
  const requestHeaders = new Headers( request.headers );
  requestHeaders.delete( AUTH_USER_HEADER );

  if ( authenticatedUser ) {
    requestHeaders.set( AUTH_USER_HEADER, JSON.stringify( authenticatedUser ) );
  }

  return requestHeaders;
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
  const isApiPath = pathname.startsWith( "/api/Yugioh/" );

  if ( !isProtectedPath( pathname ) && !isApiPath ) {
    return NextResponse.next();
  }

  const authenticatedUser = getAuthenticatedUser( request );
  const requestHeaders = buildRequestHeaders( request, authenticatedUser );
  const allowRequest = () =>
    NextResponse.next( {
      request: {
        headers: requestHeaders,
      },
    } );

  if ( request.method === "OPTIONS" ) {
    return allowRequest();
  }

  if ( isApiPath ) {
    return allowRequest();
  }

  if ( authenticatedUser ) {
    return allowRequest();
  }

  return handleUnauthorized( request );
}

export const config = {
  matcher: [
    "/yugioh/my-collection",
    "/yugioh/test-page",
    "/api/Yugioh/:path*",
  ]
};
