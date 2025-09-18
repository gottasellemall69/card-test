import jwt from "jsonwebtoken";
import clientPromise from "@/utils/mongo";
import { ObjectId } from "mongodb";

export default async function authenticate( req, res, next ) {
  const token = req.cookies?.token;

  if ( !token ) {
    return;
  }

  try {
    const decoded = jwt.verify( token, process.env.JWT_SECRET );
    req.user = decoded;

    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );

    const user = await db
      .collection( "users" )
      .findOne( { _id: new ObjectId( decoded.userId ) } );

    if ( !user ) {
      return res.status( 401 ).json( { error: "Invalid token" } );
    }

    next();
  } catch ( error ) {
    console.error( "Authentication error:", error );
    res.status( 401 ).json( { error: "Unauthorized" } );
  }
}
