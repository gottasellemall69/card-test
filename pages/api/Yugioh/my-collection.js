import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

export default async function handler( req, res ) {
  // Read token from cookie
  const token = req.cookies?.token;
  if ( !token ) {
    return res.status( 401 ).json( { error: "Unauthorized: No token provided" } );
  }

  let decodedToken;
  let userId; // this remains the field name in the DB, but it stores the username string
  try {
    decodedToken = jwt.verify( token, process.env.JWT_SECRET );
    userId = decodedToken.username; // ✅ keep using username
    if ( !userId ) {
      return res.status( 401 ).json( { error: "Unauthorized: Invalid token payload" } );
    }
  } catch ( error ) {
    console.error( "Invalid token:", error );
    return res.status( 401 ).json( { error: "Unauthorized: Invalid token" } );
  }

  const client = new MongoClient( process.env.MONGODB_URI );

  try {
    await client.connect();
    const collection = client.db( "cardPriceApp" ).collection( "myCollection" );

    switch ( req.method ) {
      case "GET": {
        const agg = [
          { $match: { userId } }, // match by username stored in userId field
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
          { $sort: { _id: 1 } },
        ];

        const result = await collection.aggregate( agg ).toArray();
        return res.status( 200 ).json( result );
      }

      default:
        res.setHeader( "Allow", [ "GET" ] );
        return res.status( 405 ).end( `Method ${ req.method } Not Allowed` );
    }
  } catch ( error ) {
    console.error( "Error executing aggregation query:", error );
    return res.status( 500 ).json( { message: "Server error" } );
  } finally {
    await client.close();
  }
}
