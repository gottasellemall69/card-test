import jwt from "jsonwebtoken";
import clientPromise from '@/utils/mongo.js';

export default async function handler( req, res ) {
  try {
    // Allow token either via Authorization header or HTTP-only cookie
    const authHeader =
      req.headers.authorization ||
      ( req.cookies.token ? `Bearer ${ req.cookies.token }` : undefined );

    if ( !authHeader || !authHeader.startsWith( "Bearer " ) ) {
      return res.status( 401 ).json( { error: "Unauthorized: No token provided" } );
    }

    // Verify JWT
    const token = authHeader.split( " " )[ 1 ];
    let decodedToken;
    try {
      decodedToken = jwt.verify( token, process.env.JWT_SECRET );
    } catch ( error ) {
      console.error( "Invalid token:", error );
      return res.status( 401 ).json( { error: "Unauthorized: Invalid token" } );
    }
    const userId = decodedToken.username;

    if ( req.method === 'POST' ) {
      const client = await clientPromise;
      const db = client.db( 'cardPriceApp' );
      const collection = db.collection( 'myCollection' );

      const { cards } = req.body;
      if ( !cards || cards.length === 0 ) {
        return res.status( 400 ).json( { error: "No cards provided." } );
      }

      const bulkOps = cards.map( card => ( {
        updateOne: {
          filter: {
            userId,
            productName: card.productName,
            setName: card.setName,
            number: card.number,
            printing: card.printing,
            rarity: card.rarity,
            condition: card.condition,
          },
          update: {
            $inc: { quantity: card.quantity || 1 },
            $set: { oldPrice: null },
            $setOnInsert: {
              marketPrice: card.marketPrice || 0,
              userId
            },
          },
          upsert: true,
        }
      } ) );

      await collection.bulkWrite( bulkOps );
      res.status( 201 ).json( { message: 'Cards saved/updated successfully' } );
    } else {
      res.status( 405 ).json( { message: 'Method Not Allowed' } );
    }
  } catch ( error ) {
    console.error( 'Error saving/updating cards:', error );
    res.status( 500 ).json( { message: 'Server error' } );
  }
}
