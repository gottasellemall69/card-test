// /utils/updateCardPricesLogic.js
import { MongoClient } from 'mongodb';
import jwt from "jsonwebtoken";

const RARITY_NORMALIZATION_MAP = {
  'Common': 'Common',
  'Common / Short Print': 'Common',
  'Rare': 'Rare',
  'Super Rare': 'Super Rare',
  'Ultra Rare': 'Ultra Rare',
  'Secret Rare': 'Secret Rare',
  'Ultimate Rare': 'Ultimate Rare',
  'Prismatic Secret Rare': 'Prismatic Secret Rare',
  'Starfoil Rare': 'Starfoil Rare',
  'Mosaic Rare': 'Mosaic Rare',
  'Shatterfoil Rare': 'Shatterfoil Rare',
  "Collector's Rare": "Collector's Rare",
  'Starlight Rare': 'Starlight Rare',
  'Ghost Rare': 'Ghost Rare',
  'Gold Rare': 'Gold Rare',
  'Gold Secret Rare': 'Gold Secret Rare',
  'Premium Gold Rare': 'Premium Gold Rare',


};

function normalizeRarity( rarity ) {
  const normalized = RARITY_NORMALIZATION_MAP[ rarity ];
  if ( !normalized ) {
    console.warn( `Unmapped rarity: ${ rarity }` );
  }
  return normalized || rarity;
}

export default async function updateCardPricesLogic( authorizationHeader ) {
  if ( !authorizationHeader ) {
    throw new Error( "Authorization token is required." );
  }

  const token = authorizationHeader.split( " " )[ 1 ];
  if ( !token ) {
    throw new Error( "Invalid authorization format." );
  }

  let decodedToken;
  let userId;
  try {
    // Verify the token
    decodedToken = jwt.verify( token, process.env.JWT_SECRET );
    userId = decodedToken.username; // Use the username from the token payload as the user identifier
  } catch ( error ) {
    console.error( "Invalid token:", error );
    return res.status( 401 ).json( { error: "Unauthorized: Invalid token" } );
  }



  const client = new MongoClient( process.env.MONGODB_URI );

  try {
    await client.connect();
    const db = client.db( 'cardPriceApp' );
    const cardsCollection = db.collection( 'myCollection' );

    const cards = await cardsCollection.find( { userId } ).toArray();
    const updateResults = [];

    for ( const card of cards ) {
      try {
        const response = await fetch(
          `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( card.productName ) }&tcgplayer_data=true`
        );

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

          const result = await cardsCollection.updateOne(
            { _id: card._id, userId },
            {
              $set: {
                marketPrice: newPrice,
                oldPrice: card.marketPrice,
              },
              $push: {
                priceHistory: {
                  date: new Date(),
                  price: newPrice,
                },
              },
            }
          );

          updateResults.push( { cardId: card._id, newPrice, modifiedCount: result.modifiedCount } );
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
  } finally {
    await client.close();
  }
}
