import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOGIN_ROUTE = "/login";
const PROTECTED_MATCHERS = [
  "/yugioh/my-collection",
  "/yugioh/test-page",
];
const AUTH_STATE_COOKIE = "auth_state";
const isProduction = process.env.NODE_ENV === "production";

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

const hasAuthenticatedCookie = ( request: NextRequest ): boolean =>
  request.cookies.get( AUTH_STATE_COOKIE )?.value === "1";

const PUBLIC_GET_API_PREFIXES = [
  "/api/Yugioh/cards/[setNameId]",
  "/api/Yugioh/cards",
  "/api/Yugioh/setNameIdMap",
  "/api/Yugioh/card/[...cardId]",
  "/api/Yugioh/card/lookup",
  "/api/Yugioh/card/[cardId]/price-history",
  "/api/Yugioh/card/[cardId]/update-price",
  "/api/Yugioh/updateCardPrices",
  "/api/Yugioh/updateCards",
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
  const returnPath = collectReturnPath( request );
  if ( returnPath ) {
    const encodedReturnPath = encodeURIComponent( returnPath ).replace( /%2F/gi, "/" );
    redirectUrl.search = `?from=${ encodedReturnPath }`;
  }

  const response = NextResponse.redirect( redirectUrl );
  clearAuthenticatedCookie( response );
  return response;
};

export function middleware( request: NextRequest ) {
  const { pathname } = request.nextUrl;
  const isApiPath = pathname.startsWith( "/api/Yugioh/" );

  if ( !isProtectedPath( pathname ) && !isApiPath ) {
    return NextResponse.next();
  }

  if ( request.method === "OPTIONS" ) {
    return NextResponse.next();
  }

  if ( isApiPath && isPublicApiRequest( request ) ) {
    return NextResponse.next();
  }

  if ( isApiPath ) {
    return NextResponse.next();
  }

  if ( hasAuthenticatedCookie( request ) ) {
    return NextResponse.next();
  }

  return handleUnauthorized( request );
}

export const config = {
  matcher: [
    "/yugioh/my-collection",
    "/api/Yugioh/:path*",
  ]
};
