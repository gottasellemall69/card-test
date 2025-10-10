import clientPromise from "@/utils/mongo.js";
import { requireUser } from "@/middleware/authenticate";

export default async function handler( req, res ) {
  if ( req.method !== "POST" ) {
    res.setHeader( "Allow", [ "POST" ] );
    return res.status( 405 ).json( { message: "Method Not Allowed" } );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  try {
    const { cards } = req.body ?? {};
    if ( !Array.isArray( cards ) || cards.length === 0 ) {
      return res.status( 400 ).json( { error: "No cards provided." } );
    }

    const client = await clientPromise;
    const db = client.db( "cardPriceApp" );
    const collection = db.collection( "myCollection" );

    const sanitizedCards = cards
      .filter( ( card ) => card && typeof card === "object" )
      .map( ( card ) => {
        const rawCardId = card?.cardId;
        const normalizedCardId =
          rawCardId === null || rawCardId === undefined ? null : String( rawCardId );
        return {
          ...card,
          cardId: normalizedCardId,
        };
      } );
    if ( sanitizedCards.length === 0 ) {
      return res.status( 400 ).json( { error: "No valid card data provided." } );
    }

    const bulkOps = sanitizedCards.map( ( card ) => ( {
      updateOne: {
        filter: {
          userId: auth.decoded.username,
          productName: card.productName,
          setName: card.setName,
          number: card.number,
          printing: card.printing,
          rarity: card.rarity,
          condition: card.condition
        },
        update: {
          $inc: { quantity: card.quantity || 1 },
          $set: {
            oldPrice: null,
            cardId: card.cardId || null,
          },
          $setOnInsert: {
            marketPrice: card.marketPrice || 0,
            lowPrice: card.lowPrice || 0,
            userId: auth.decoded.username
          }
        },
        upsert: true
      }
    } ) );

    await collection.bulkWrite( bulkOps );
    return res.status( 201 ).json( { message: "Cards saved/updated successfully" } );
  } catch ( error ) {
    console.error( "Error saving/updating cards:", error );
    return res.status( 500 ).json( { message: "Server error" } );
  }
}
