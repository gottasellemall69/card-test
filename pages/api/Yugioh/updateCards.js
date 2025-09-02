import { MongoClient, ObjectId } from "mongodb";
import jwt from "jsonwebtoken";

export default async function handler( req, res ) {
  if ( req.method !== "PATCH" ) {
    res.setHeader( "Allow", [ "PATCH" ] );
    return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
  }

  // Cookie-only
  const token = req.cookies?.token;
  if ( !token ) {
    return res.status( 401 ).json( { message: "Unauthorized: No token provided" } );
  }

  let decodedToken;
  try {
    decodedToken = jwt.verify( token, process.env.JWT_SECRET );
  } catch ( error ) {
    console.error( "Invalid token:", error );
    return res.status( 401 ).json( { message: "Unauthorized: Invalid token" } );
  }

  const userId = decodedToken.username; // ✅ keep using username
  const client = new MongoClient( process.env.MONGODB_URI );
  await client.connect();
  const db = client.db( "cardPriceApp" );
  const cards = db.collection( "myCollection" );
  const { cardId, field, value } = req.body;

  try {
    const result = await cards.updateOne(
      { _id: new ObjectId( cardId ), userId }, // restrict by username
      { $set: { [ field ]: value } }
    );

    if ( result.modifiedCount > 0 ) {
      return res.status( 200 ).json( { message: "Card updated successfully" } );
    }
    return res
      .status( 404 )
      .json( { message: "Card not found or does not belong to the user" } );
  } catch ( error ) {
    console.error( "Update error:", error );
    return res
      .status( 500 )
      .json( { message: `Internal server error: ${ error.message }` } );
  } finally {
    await client.close();
  }
}
