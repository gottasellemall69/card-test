import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
  const { cardId } = req.query;

  if ( !cardId ) {
    return res.status( 400 ).json( { error: "Missing card ID" } );
  }

  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( cardId ) }&tcgplayer_data=true`;
    const response = await fetch( url );
    const data = await response.json();

    if ( !data || !data.data || data.data.length === 0 ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    const card = data.data[ 0 ];

    // Ensure prices are included, even if missing from the API
    const defaultPrice = "N/A";
    const formattedCard = {
      id: card.id,
      name: card.name,
      type: card.type,
      desc: card.desc,
      race: card.race,
      archetype: card.archetype || "N/A",
      card_sets: card.card_sets?.map( ( set ) => ( {
        set_name: set.set_name,
        set_code: set.set_code,
        set_edition: set.set_edition,
        set_price: set.set_price || defaultPrice
      } ) ) || [],
      card_prices: {
        cardmarket_price: card.card_prices?.cardmarket_price || defaultPrice,
        tcgplayer_price: card.card_prices?.tcgplayer_price || defaultPrice,
        ebay_price: card.card_prices?.ebay_price || defaultPrice,
        amazon_price: card.card_prices?.amazon_price || defaultPrice,
        coolstuffinc_price: card.card_prices?.coolstuffinc_price || defaultPrice
      }
    };

    res.status( 200 ).json( formattedCard );
  } catch ( error ) {
    console.error( "Fetching card data failed:", error );
    res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
