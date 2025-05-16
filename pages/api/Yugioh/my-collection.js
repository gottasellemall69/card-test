import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

export default async function handler( req, res ) {
  const authHeader = req.headers.authorization;

  // Validate the Authorization header
  if ( !authHeader || !authHeader.startsWith( "Bearer " ) ) {
    return res.status( 401 ).json( { error: "Unauthorized: No token provided" } );
  }

  const token = authHeader.split( " " )[ 1 ];

  let decodedToken;
  let userId;

  try {
    decodedToken = jwt.verify( token, process.env.JWT_SECRET );
    userId = decodedToken.username; // Ensure this matches the field in the token payload
  } catch ( error ) {
    console.error( "Invalid token:", error );
    return res.status( 401 ).json( { error: "Unauthorized: Invalid token" } );
  }

  const client = new MongoClient( process.env.MONGODB_URI );

  try {
    await client.connect();
    const collection = client.db( "cardPriceApp" ).collection( "myCollection" );

    switch ( req.method ) {
      case "GET":
        // Ensure we fetch only the current user's collection
        const agg = [
          {
            $match: { userId }, // Match documents where userId matches the logged-in user
          },
          {
            $project: {
              _id: 1,
              productName: 1,
              setName: 1,
              number: 1,
              printing: 1,
              rarity: 1,
              condition: 1,
              oldPrice: 1,
              marketPrice: 1,
              lowPrice: 1,
              quantity: 1,
            },
          },
          {
            $sort: { _id: 1 },
          },
        ];

        const result = await collection.aggregate( agg ).toArray();
        res.status( 200 ).json( result );
        break;

      default:
        res.setHeader( "Allow", [ "GET" ] );
        res.status( 405 ).end( `Method ${ req.method } Not Allowed` );
    }
  } catch ( error ) {
    console.error( "Error executing aggregation query:", error );
    res.status( 500 ).json( { message: "Server error" } );
  } finally {
    await client.close();
  }
}
