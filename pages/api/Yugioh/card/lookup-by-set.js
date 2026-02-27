const normalizeToken = ( value ) =>
  ( value ?? "" ).toString().toLowerCase().replace( /[^a-z0-9]+/g, "" ).trim();

const formatCard = ( card ) => ( {
  id: card?.id,
  name: card?.name,
  type: card?.type,
  desc: card?.desc,
  frameType: card?.frameType,
  race: card?.race,
  archetype: card?.archetype,
  ygoprodeck_url: card?.ygoprodeck_url,
  card_images: card?.card_images?.map( ( img ) => ( {
    id: img?.id,
    image_url: img?.image_url,
    image_url_small: img?.image_url_small,
  } ) ) || [],
  card_sets: card?.card_sets?.map( ( set ) => ( {
    set_name: set.set_name,
    set_code: set.set_code,
    set_rarity: set.set_rarity,
    rarity_code: set.set_rarity_code,
    set_edition: set.set_edition || "Unknown Edition",
    set_price: set.set_price || "0.00",
  } ) ) || [],
  card_prices: card?.card_prices?.map( ( price ) => ( {
    tcgplayer_price: price.tcgplayer_price || "0.00",
    ebay_price: price.ebay_price || "0.00",
    amazon_price: price.amazon_price || "0.00",
  } ) ) || [],
} );

const matchesSetCode = ( setCode, targetCode ) => {
  if ( !setCode || !targetCode ) return false;
  const normalizedSet = normalizeToken( setCode );
  const normalizedTarget = normalizeToken( targetCode );
  return normalizedSet === normalizedTarget;
};

const pickBestMatch = ( cards, setCode, cardName ) => {
  if ( !Array.isArray( cards ) || cards.length === 0 ) {
    return null;
  }

  const normalizedName = normalizeToken( cardName );

  const codeMatches = cards.filter( ( card ) =>
    Array.isArray( card?.card_sets ) &&
    card.card_sets.some( ( set ) => matchesSetCode( set?.set_code, setCode ) )
  );

  if ( codeMatches.length === 0 ) {
    return null;
  }

  if ( normalizedName ) {
    const exactName = codeMatches.find(
      ( card ) => normalizeToken( card?.name ) === normalizedName
    );
    if ( exactName ) {
      return exactName;
    }
  }

  return codeMatches[ 0 ];
};

export default async function handler( req, res ) {
  if ( req.method !== "GET" ) {
    res.setHeader( "Allow", [ "GET" ] );
    return res.status( 405 ).json( { message: "Method Not Allowed" } );
  }

  const rawSetName = Array.isArray( req.query.set_name )
    ? req.query.set_name[ 0 ]
    : req.query.set_name;
  const rawSetCode = Array.isArray( req.query.set_code )
    ? req.query.set_code[ 0 ]
    : req.query.set_code;
  const rawCardName = Array.isArray( req.query.card_name )
    ? req.query.card_name[ 0 ]
    : req.query.card_name;

  const setName = rawSetName ? rawSetName.toString().trim() : "";
  const setCode = rawSetCode ? rawSetCode.toString().trim() : "";
  const cardName = rawCardName ? rawCardName.toString().trim() : "";

  if ( !setName || !setCode ) {
    return res.status( 400 ).json( { error: "Missing set name or set code" } );
  }

  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?cardset=${ encodeURIComponent( setName ) }&tcgplayer_data=true`;
    const response = await fetch( url );

    if ( !response.ok ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    const data = await response.json();
    const cards = Array.isArray( data?.data ) ? data.data : [];
    const match = pickBestMatch( cards, setCode, cardName );

    if ( !match ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    return res.status( 200 ).json( formatCard( match ) );
  } catch ( error ) {
    console.error( "Set lookup failed:", error );
    return res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
