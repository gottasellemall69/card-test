export default async function handler( req, res ) {
  const { name } = req.query;
  const normalizedName = Array.isArray( name ) ? name[ 0 ] : name;

  if ( !normalizedName ) {
    return res.status( 400 ).json( { error: "Missing card name" } );
  }

  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( normalizedName ) }&tcgplayer_data=true`;
    const response = await fetch( url );
    const data = await response.json();

    if ( !Array.isArray( data?.data ) || data.data.length === 0 ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    const card = data.data?.[ 0 ];

    const formattedCard = {
      id: card?.id,
      name: card?.name,
      type: card?.type,
      desc: card?.desc,
      frameType: card?.frameType,
      race: card?.race,
      archetype: card?.archetype,
      ygoprodeck_url: card?.ygoprodeck_url,
      card_sets: card?.card_sets?.map( ( set ) => ( {
        set_name: set.set_name,
        set_code: set.set_code,
        set_rarity: set.set_rarity,
        rarity_code: set.set_rarity_code,
        set_edition: set.set_edition || "Unknown Edition",
        set_price: set.set_price,
      } ) ) || [],
      card_prices: card?.card_prices?.map( ( price ) => ( {
        tcgplayer_price: price.tcgplayer_price || "0.00",
        ebay_price: price.ebay_price || "0.00",
        amazon_price: price.amazon_price || "0.00",
      } ) ) || [],
    };

    res.status( 200 ).json( formattedCard );
  } catch ( error ) {
    console.error( "Card lookup failed:", error );
    res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
