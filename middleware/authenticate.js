import jwt from "jsonwebtoken";
import clientPromise from "@/utils/mongo";
import { ObjectId } from "mongodb";

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

export async function requireUser(
  req,
  res,
  { ensureDatabaseUser = false } = {}
) {
  const token = getTokenFromRequest( req );

  if ( !token ) {
    res.status( 401 ).json( { error: "Unauthorized: No token provided" } );
    return null;
  }

  let decoded;
  try {
    decoded = jwt.verify( token, process.env.JWT_SECRET );
  } catch ( error ) {
    console.error( "Invalid token:", error );
    res.status( 401 ).json( { error: "Unauthorized: Invalid token" } );
    return null;
  }

  if ( !decoded?.userId || !decoded?.username ) {
    res.status( 401 ).json( { error: "Unauthorized: Invalid token payload" } );
    return null;
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
      res.status( 401 ).json( { error: "Unauthorized: User not found" } );
      return null;
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
