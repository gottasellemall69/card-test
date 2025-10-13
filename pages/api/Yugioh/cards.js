import clientPromise from "@/utils/mongo.js";
import { requireUser } from "@/middleware/authenticate";
import { ensureSafeUserId, coerceNumberField, coerceStringField } from "@/utils/securityValidators.js";

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
    const safeUserId = ensureSafeUserId( auth.decoded.username );

    const sanitizedCards = [];

    for ( const card of cards ) {
      if ( !card || typeof card !== "object" ) {
        continue;
      }

      try {
        const sanitizedCard = {
          productName: coerceStringField( card.productName, { maxLength: 256 } ),
          setName: coerceStringField( card.setName, { maxLength: 256 } ),
          number: coerceStringField( card.number ?? "", { maxLength: 128, allowEmpty: true } ),
          printing: coerceStringField( card.printing ?? "", { maxLength: 128, allowEmpty: true } ),
          rarity: coerceStringField( card.rarity ?? "", { maxLength: 128, allowEmpty: true } ),
          condition: coerceStringField( card.condition ?? "", { maxLength: 128, allowEmpty: true } ),
          marketPrice: coerceNumberField( card.marketPrice ?? 0 ),
          lowPrice: coerceNumberField( card.lowPrice ?? 0 ),
          quantity: coerceNumberField( card.quantity ?? 1, { min: 0 } ),
          cardId:
            card.cardId === null || card.cardId === undefined
              ? null
              : coerceStringField( card.cardId, { maxLength: 128 } ),
        };

        sanitizedCards.push( sanitizedCard );
      } catch ( error ) {
        console.warn( "Skipping invalid card payload:", error?.message ?? error );
      }
    }

    if ( sanitizedCards.length === 0 ) {
      return res.status( 400 ).json( { error: "No valid card data provided." } );
    }

    const bulkOps = sanitizedCards.map( ( card ) => ( {
      updateOne: {
        filter: {
          userId: safeUserId,
          productName: card.productName,
          setName: card.setName,
          number: card.number,
          printing: card.printing,
          rarity: card.rarity,
          condition: card.condition
        },
        update: {
          $inc: { quantity: card.quantity },
          $set: {
            oldPrice: null,
            cardId: card.cardId || null,
          },
          $setOnInsert: {
            marketPrice: card.marketPrice || 0,
            lowPrice: card.lowPrice || 0,
            userId: safeUserId
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
