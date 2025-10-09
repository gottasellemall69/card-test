import { MongoClient } from "mongodb";
import { requireUser } from "@/middleware/authenticate";

export default async function handler( req, res ) {
  if ( req.method !== "DELETE" ) {
    res.setHeader( "Allow", [ "DELETE" ] );
    return res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  const client = new MongoClient( process.env.MONGODB_URI );

  try {
    await client.connect();
    const db = client.db( "cardPriceApp" );
    const collection = db.collection( "myCollection" );

    const result = await collection.deleteMany( { userId: auth.decoded.username } );

    if ( result.deletedCount > 0 ) {
      return res.status( 200 ).json( { message: "All cards deleted successfully" } );
    }

    return res.status( 404 ).json( { message: "No cards found to delete" } );
  } catch ( error ) {
    console.error( "Delete error:", error );
    return res.status( 500 ).json( { message: `Internal server error: ${ error.message }` } );
  } finally {
    await client.close();
  }
}
