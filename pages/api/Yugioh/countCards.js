import { MongoClient } from "mongodb";
import { requireUser } from "@/middleware/authenticate";

const uri = process.env.MONGODB_URI;
const client = new MongoClient( uri );

export default async function handler( req, res ) {
  if ( req.method !== "GET" ) {
    res.setHeader( "Allow", [ "GET" ] );
    return res.status( 405 ).json( { error: `Method ${ req.method } Not Allowed` } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  try {
    await client.connect();
    const database = client.db( "cardPriceApp" );
    const cards = database.collection( "myCollection" );

    const aggregationPipeline = [
      { $match: { userId: auth.decoded.username } },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: { $toDouble: "$quantity" } },
          totalMarketPrice: {
            $sum: {
              $multiply: [
                { $toDouble: "$quantity" },
                { $toDouble: "$marketPrice" }
              ]
            }
          }
        }
      },
      {
        $project: {
          totalQuantity: 1,
          totalMarketPrice: 1
        }
      }
    ];

    const aggregationResult = await cards.aggregate( aggregationPipeline ).toArray();
    const totalQuantity = aggregationResult[ 0 ] ? aggregationResult[ 0 ].totalQuantity : 0;
    const totalMarketPrice = aggregationResult[ 0 ]
      ? Number.parseFloat( aggregationResult[ 0 ].totalMarketPrice ).toFixed( 2 )
      : 0;

    return res.status( 200 ).json( { totalQuantity, totalMarketPrice } );
  } catch ( error ) {
    console.error( "Unable to fetch card data:", error );
    return res.status( 500 ).json( { error: "Unable to fetch card data" } );
  }
}
