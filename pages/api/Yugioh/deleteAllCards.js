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

  try {
    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const collection = db.collection( "myCollection" );
    const safeUserId = ensureSafeUserId( auth.decoded.username );

    const result = await collection.deleteMany( { userId: safeUserId } );

    if ( result.deletedCount > 0 ) {
      return res.status( 200 ).json( { message: "All cards deleted successfully" } );
    }

    return res.status( 404 ).json( { message: "No cards found to delete" } );
  } catch ( error ) {
    console.error( "Delete error:", error );
    return res.status( 500 ).json( { message: `Internal server error: ${ error.message }` } );
  }
}
