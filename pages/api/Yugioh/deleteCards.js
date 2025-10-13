import { ObjectId } from "mongodb";
import { requireUser } from "@/middleware/authenticate";
import clientPromise from "@/utils/mongo.js";
import { ensureSafeUserId } from "@/utils/securityValidators.js";

export default async function handler( req, res ) {
  if ( req.method !== "DELETE" ) {
    res.setHeader( "Allow", [ "DELETE" ] );
    return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  const { cardId } = req.body ?? {};

  if ( typeof cardId !== "string" || !ObjectId.isValid( cardId ) ) {
    return res.status( 400 ).json( { message: "Invalid card identifier" } );
  }

  try {
    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const cards = db.collection( "myCollection" );
    const safeUserId = ensureSafeUserId( auth.decoded.username );

    const result = await cards.deleteOne( {
      _id: new ObjectId( cardId ),
      userId: safeUserId
    } );

    if ( result.deletedCount >= 1 ) {
      return res.status( 200 ).json( { message: "Card deleted successfully" } );
    }

    return res.status( 404 ).json( { message: "Card not found or does not belong to the user" } );
  } catch ( error ) {
    console.error( "Delete error:", error );
    return res.status( 500 ).json( { message: `Internal server error: ${ error.message }` } );
  }
}
