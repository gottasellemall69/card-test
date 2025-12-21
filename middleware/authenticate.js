import jwt from "jsonwebtoken";
import clientPromise from "@/utils/mongo";
import { ObjectId } from "mongodb";

const isProduction = process.env.NODE_ENV === "production";
const baseCookieAttributes = [ "Path=/", "SameSite=Strict" ];
if ( isProduction ) {
  baseCookieAttributes.push( "Secure" );
}
const expiredCookieAttributes = [ ...baseCookieAttributes, "Max-Age=0" ];
const EXPIRED_TOKEN_COOKIE = `token=; HttpOnly; ${ expiredCookieAttributes.join( "; " ) }`;
const EXPIRED_AUTH_STATE_COOKIE = `auth_state=; ${ expiredCookieAttributes.join( "; " ) }`;

function appendSetCookie( res, cookies ) {
  const existing = res.getHeader( "Set-Cookie" );

  if ( !existing ) {
    res.setHeader( "Set-Cookie", cookies );
    return;
  }

  if ( Array.isArray( existing ) ) {
    res.setHeader( "Set-Cookie", [ ...existing, ...cookies ] );
    return;
  }

  res.setHeader( "Set-Cookie", [ existing, ...cookies ] );
}

function clearAuthCookies( res ) {
  appendSetCookie( res, [ EXPIRED_TOKEN_COOKIE, EXPIRED_AUTH_STATE_COOKIE ] );
}

function respondUnauthorized( res, message ) {
  clearAuthCookies( res );
  res.status( 401 ).json( { error: message } );
  return null;
}

function extractBearerToken( headerValue ) {
  if ( !headerValue || typeof headerValue !== "string" ) {
    return null;
  }

  const [ scheme, value ] = headerValue.split( " " );
  if ( scheme?.toLowerCase() !== "bearer" || !value ) {
    return null;
  }

  return value.trim();
}

function getTokenFromCookies( req ) {
  const cookieToken = req.cookies?.token;
  return typeof cookieToken === "string" && cookieToken.length > 0
    ? cookieToken
    : null;
}

export function getTokenFromRequest( req ) {
  return (
    extractBearerToken( req.headers?.authorization ) ||
    getTokenFromCookies( req ) ||
    null
  );
}

function getUserFromMiddleware( req ) {
  const headerValue = req.headers?.[ "x-authenticated-user" ];
  const rawValue = Array.isArray( headerValue ) ? headerValue[ 0 ] : headerValue;

  if ( typeof rawValue !== "string" || rawValue.length === 0 ) {
    return null;
  }

  try {
    const parsed = JSON.parse( rawValue );
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.userId &&
      parsed.username
    ) {
      return parsed;
    }
  } catch ( error ) {
    console.warn( "Failed to parse x-authenticated-user header:", error );
  }

  return null;
}

export async function requireUser(
  req,
  res,
  { ensureDatabaseUser = false } = {}
) {
  const middlewareUser = getUserFromMiddleware( req );
  const token = getTokenFromRequest( req );

  if ( !token && !middlewareUser ) {
    return respondUnauthorized( res, "Unauthorized: No token provided" );
  }

  let decoded = middlewareUser;

  if ( !decoded ) {
    try {
      decoded = jwt.verify( token, process.env.JWT_SECRET );
    } catch ( error ) {
      console.error( "Invalid token:", error );
      return respondUnauthorized( res, "Unauthorized: Invalid token" );
    }
  }

  if ( !decoded ) {
    return respondUnauthorized( res, "Unauthorized: Invalid token payload" );
  }

  if ( !decoded?.userId || !decoded?.username ) {
    return respondUnauthorized( res, "Unauthorized: Invalid token payload" );
  }

  req.user = decoded;

  if ( !ensureDatabaseUser ) {
    return { token, decoded };
  }

  try {
    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const user = await db
      .collection( "users" )
      .findOne( { _id: new ObjectId( decoded.userId ) } );

    if ( !user ) {
      return respondUnauthorized( res, "Unauthorized: User not found" );
    }

    return { token, decoded, user };
  } catch ( error ) {
    console.error( "Authentication lookup error:", error );
    res.status( 500 ).json( { error: "Internal server error" } );
    return null;
  }
}

export default async function authenticate( req, res, next ) {
  const authResult = await requireUser( req, res, { ensureDatabaseUser: true } );
  if ( !authResult ) {
    return;
  }

  if ( typeof next === "function" ) {
    return next();
  }
}
