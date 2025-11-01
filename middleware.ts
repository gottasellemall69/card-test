import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const LOGIN_ROUTE = "/login";
const PROTECTED_MATCHERS = [
  "/yugioh/my-collection",
  "/yugioh/test-page",
];
const AUTH_STATE_COOKIE = "auth_state";
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24;
const isProduction = process.env.NODE_ENV === "production";

const setAuthenticatedCookie = ( response: NextResponse ) => {
  response.cookies.set( {
    name: AUTH_STATE_COOKIE,
    value: "1",
    maxAge: AUTH_COOKIE_MAX_AGE,
    sameSite: "strict",
    path: "/",
    secure: isProduction,
    httpOnly: false,
  } );
};

const clearAuthenticatedCookie = ( response: NextResponse ) => {
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

const getToken = ( request: NextRequest ): string | null => {
  const bearer = request.headers.get( "authorization" );
  if ( bearer?.toLowerCase().startsWith( "bearer " ) ) {
    const token = bearer.slice( 7 ).trim();
    if ( token ) {
      return token;
    }
  }

  const cookieToken = request.cookies.get( "token" );
  return cookieToken?.value ?? null;
};

const PUBLIC_GET_API_PREFIXES = [
  "/api/Yugioh/cards",
  "/api/Yugioh/setNameIdMap",
  "/api/Yugioh/card/[...cardId]",
  "/api/Yugioh/card/lookup",
  "/api/Yugioh/card/[cardId]/price-history",
  "/api/Yugioh/card/[cardId]/update-price"
];

const isPublicApiRequest = ( request: NextRequest ): boolean => {
  if ( request.method !== "GET" ) {
    return false;
  }

  const pathname = request.nextUrl.pathname;
  return PUBLIC_GET_API_PREFIXES.some( ( prefix ) =>
    pathname === prefix || pathname.startsWith( `${ prefix }/` )
  );
};

const handleUnauthorized = ( request: NextRequest ) => {
  if ( request.nextUrl.pathname.startsWith( "/api/" ) ) {
    const response = NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
    clearAuthenticatedCookie( response );
    return response;
  }

  const redirectUrl = new URL( LOGIN_ROUTE, request.url );

  const response = NextResponse.redirect( redirectUrl );
  clearAuthenticatedCookie( response );
  return response;
};

export function middleware( request: NextRequest ) {
  const { pathname } = request.nextUrl;

  if ( !isProtectedPath( pathname ) && !pathname.startsWith( "/api/Yugioh" ) ) {
    return NextResponse.next();
  }

  if ( request.method === "OPTIONS" ) {
    return NextResponse.next();
  }

  if ( pathname.startsWith( "/api/Yugioh" ) && isPublicApiRequest( request ) ) {
    return NextResponse.next();
  }

  const token = getToken( request );
  if ( !token ) {
    return handleUnauthorized( request );
  }

  const secret = process.env.JWT_SECRET;
  if ( !secret ) {
    console.error( "JWT_SECRET is not configured" );
    return handleUnauthorized( request );
  }

  try {
    const decoded = jwt.verify( token, secret );
    const payload =
      typeof decoded === "object" && decoded !== null
        ? decoded
        : { sub: decoded };

    const headers = new Headers( request.headers );
    headers.set( "x-authenticated-user", JSON.stringify( payload ) );

    const response = NextResponse.next( {
      request: {
        headers,
      },
    } );
    setAuthenticatedCookie( response );
    return response;
  } catch ( error ) {
    console.error( "Failed to verify token in middleware:", error );
    return handleUnauthorized( request );
  }
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/yugioh/my-collection",
    "/yugioh/test-page/:path*",
    "/api/Yugioh/:path*",
  ],
};
