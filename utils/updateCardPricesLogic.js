// /utils/updateCardPricesLogic.js
import clientPromise from "@/utils/mongo.js";
import jwt from "jsonwebtoken";
import { ensureSafeUserId } from "@/utils/securityValidators.js";
import { recordPriceHistoryEntry } from "@/utils/priceHistoryStore";

const RARITY_NORMALIZATION_MAP = {
  "Common": "Common",
  "Common / Short Print": "Common",
  "Rare": "Rare",
  "Super Rare": "Super Rare",
  "Ultra Rare": "Ultra Rare",
  "Secret Rare": "Secret Rare",
  "Ultimate Rare": "Ultimate Rare",
  "Prismatic Secret Rare": "Prismatic Secret Rare",
  "Starfoil Rare": "Starfoil Rare",
  "Mosaic Rare": "Mosaic Rare",
  "Shatterfoil Rare": "Shatterfoil Rare",
  "Collector's Rare": "Collector's Rare",
  "Starlight Rare": "Starlight Rare",
  "Ghost Rare": "Ghost Rare",
  "Gold Rare": "Gold Rare",
  "Gold Secret Rare": "Gold Secret Rare",
  "Premium Gold Rare": "Premium Gold Rare",
  "Quarter Century Secret Rare": "Quarter Century Secret Rare"
};

function normalizeRarity( rarity ) {
  const normalized = RARITY_NORMALIZATION_MAP[ rarity ];
  if ( !normalized ) {
    console.warn( `Unmapped rarity: ${ rarity }` );
  }
  return normalized || rarity;
}

function createAuthError( message ) {
  const error = new Error( message );
  error.statusCode = 401;
  return error;
}

function resolveAuthContext( authContext ) {
  if ( !authContext ) {
    throw createAuthError( "Authorization token is required." );
  }

  if ( typeof authContext === "string" ) {
    const parts = authContext.trim().split( " " );
    const token = parts.length === 2 ? parts[ 1 ] : parts[ 0 ];
    if ( !token ) {
      throw createAuthError( "Invalid authorization format." );
    }

    try {
      const decoded = jwt.verify( token, process.env.JWT_SECRET );
      return { token, decoded };
    } catch ( error ) {
      console.error( "Invalid token:", error );
      throw createAuthError( "Unauthorized: Invalid token" );
    }
  }

  const { token, decoded } = authContext;

  if ( !decoded && !token ) {
    throw createAuthError( "Authorization token is required." );
  }

  if ( decoded ) {
    if ( !decoded.username ) {
      throw createAuthError( "Unauthorized: Invalid token payload" );
    }
    return { token, decoded };
  }

  try {
    const verified = jwt.verify( token, process.env.JWT_SECRET );
    if ( !verified.username ) {
      throw createAuthError( "Unauthorized: Invalid token payload" );
    }
    return { token, decoded: verified };
  } catch ( error ) {
    console.error( "Invalid token:", error );
    throw createAuthError( "Unauthorized: Invalid token" );
  }
}

export default async function updateCardPricesLogic( authContext ) {
  const { decoded } = resolveAuthContext( authContext );
  const userId = ensureSafeUserId( decoded.username );
  const client = await clientPromise;
  const db = client.db( "cardPriceApp" );
  const cardsCollection = db.collection( "myCollection" );
  const cards = await cardsCollection.find( { userId } ).toArray();
  const updateResults = [];

  for ( const card of cards ) {
    try {
      const response = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( card.productName ) }&tcgplayer_data=true`
      );

      if ( !response.ok ) {
        console.warn( `Failed to fetch card info for ${ card.productName }` );
        continue;
      }

      const data = await response.json();

      if ( !data.data || data.data.length === 0 ) {
        console.warn( `No data found for card: ${ card.productName }` );
        continue;
      }

      const cardData = data.data[ 0 ];
      const matchingSet = cardData.card_sets?.find(
        ( set ) =>
          set.set_name === card.setName &&
          set.set_code === card.number &&
          set.set_edition === card.printing &&
          normalizeRarity( set.set_rarity ) === normalizeRarity( card.rarity )
      );

      if ( matchingSet ) {
        const newPrice = matchingSet.set_price ? parseFloat( matchingSet.set_price ) : null;

        const updateResult = await cardsCollection.updateOne(
          { _id: card._id, userId },
          {
            $set: {
              marketPrice: newPrice,
              oldPrice: card.marketPrice
            }
          }
        );

        await recordPriceHistoryEntry( {
          cardId: card.cardId ?? cardData?.id?.toString() ?? null,
          setName: card.setName,
          number: card.number,
          rarity: card.rarity,
          edition: card.printing,
          price: newPrice
        } );

        updateResults.push( { cardId: card._id, newPrice, modifiedCount: updateResult.modifiedCount } );
      } else {
        console.warn(
          `No matching set found for card: ${ card.productName } (Set: ${ card.setName }, Number: ${ card.number }, Rarity: ${ card.rarity })`
        );
      }
    } catch ( error ) {
      console.error( `Error updating card ${ card.productName }:`, error );
    }
  }

  return updateResults;
}
