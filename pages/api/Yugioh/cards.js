import jwt from "jsonwebtoken";
import clientPromise from "@/utils/mongo.js";

export default async function handler( req, res ) {
  if ( req.method !== "POST" ) {
    return res.status( 405 ).json( { message: "Method Not Allowed" } );
  }

  try {
    const token = req.cookies?.token;
    if ( !token ) {
      return res.status( 401 ).json( { error: "Unauthorized: No token provided" } );
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify( token, process.env.JWT_SECRET );
    } catch ( error ) {
      console.error( "Invalid token:", error );
      return res.status( 401 ).json( { error: "Unauthorized: Invalid token" } );
    }

    const userId = decodedToken.username; // ✅ keep using username
    if ( !userId ) {
      return res.status( 401 ).json( { error: "Unauthorized: Missing username in token" } );
    }

    const { cards } = req.body;
    if ( !cards || cards.length === 0 ) {
      return res.status( 400 ).json( { error: "No cards provided." } );
    }

    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const collection = db.collection( "myCollection" );

    const bulkOps = cards.map( ( card ) => ( {
      updateOne: {
        filter: {
          userId, // username stored in userId field
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
            lowPrice: card.lowPrice || 0,
            userId,
          },
        },
        upsert: true,
      },
    } ) );

    await collection.bulkWrite( bulkOps );
    return res.status( 201 ).json( { message: "Cards saved/updated successfully" } );
  } catch ( error ) {
    console.error( "Error saving/updating cards:", error );
    return res.status( 500 ).json( { message: "Server error" } );
  }
}
