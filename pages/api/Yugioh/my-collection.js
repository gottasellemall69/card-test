import { MongoClient } from "mongodb";
import { requireUser } from "@/middleware/authenticate";

export default async function handler( req, res ) {
  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  const userId = auth.decoded.username; // keep using username in the myCollection userId field
  const client = new MongoClient( process.env.MONGODB_URI );

  try {
    await client.connect();
    const collection = client.db( "cardPriceApp" ).collection( "myCollection" );

    switch ( req.method ) {
      case "GET": {
        const agg = [
          { $match: { userId } },
          {
            $project: {
              _id: 1,
              cardId: 1,
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
