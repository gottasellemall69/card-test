import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

export default async function handler( req, res ) {
  if ( req.method === "DELETE" ) {
    // Allow token from header or cookie
    const authHeader =
      req.headers.authorization ||
      ( req.cookies.token ? `Bearer ${ req.cookies.token }` : undefined );

    if ( !authHeader || !authHeader.startsWith( "Bearer " ) ) {
      return res.status( 401 ).json( { message: "Unauthorized: No token provided" } );
    }

    // Verify JWT
    const token = authHeader.split( " " )[ 1 ];
    let decodedToken;
    try {
      decodedToken = jwt.verify( token, process.env.JWT_SECRET );
    } catch ( error ) {
      console.error( "Invalid token:", error );
      return res.status( 401 ).json( { message: "Unauthorized: Invalid token" } );
    }
    const userId = decodedToken.username;

    const client = new MongoClient( process.env.MONGODB_URI );
    await client.connect();
    const db = client.db( "cardPriceApp" );
    const collection = db.collection( "myCollection" );

    try {
      const result = await collection.deleteMany( { userId } );
      if ( result.deletedCount > 0 ) {
        res.status( 200 ).json( { message: "All cards deleted successfully" } );
      } else {
        res.status( 404 ).json( { message: "No cards found to delete" } );
      }
    } catch ( error ) {
      console.error( "Delete error:", error );
      res.status( 500 ).json( { message: `Internal server error: ${ error.message }` } );
    } finally {
      await client.close();
    }
  } else {
    res.setHeader( "Allow", [ "DELETE" ] );
    res.status( 405 ).json( { message: `Method ${ req.method } Not Allowed` } );
  }
}
