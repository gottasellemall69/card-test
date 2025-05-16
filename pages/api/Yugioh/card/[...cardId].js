export default async function handler( req, res ) {
  const { cardId } = req.query;

  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( cardId ) }&tcgplayer_data=true`;
    const response = await fetch( url );
    const data = await response.json();

    if ( !data || data.data.length === 0 ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    const card = data?.data[ 0 ];

    const formattedCard = {
      id: card?.id,
      name: card?.name,
      type: card?.type,
      desc: card?.desc,
      frameType: card?.frameType,
      race: card?.race,
      archetype: card?.archetype,
      ygoprodeck_url: card?.ygoprodeck_url,
      card_sets: card?.card_sets?.map( set => ( {
        set_name: set.set_name,
        set_code: set.set_code,
        set_rarity: set.set_rarity,
        set_edition: set.set_edition || "Unknown Edition",
        set_price: set.set_price
      } ) ) || [],
      card_prices: card?.card_prices?.[ 0 ] || {},
      ebay_price: card?.card_prices?.[ 0 ]?.ebay_price || {}
    };

    res.status( 200 ).json( formattedCard );
  } catch ( error ) {
    console.error( "❌ Fetching card data failed:", error );
    res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
