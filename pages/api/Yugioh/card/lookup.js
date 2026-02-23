const normalizeNameKey = ( value ) =>
  ( value ?? "" ).toString().toLowerCase().replace( /[^a-z0-9]+/g, "" ).trim();

const buildNameCandidates = ( name ) => {
  const trimmed = ( name ?? "" ).toString().trim();
  if ( !trimmed ) return [];

  const candidates = new Set( [ trimmed ] );
  const withoutParens = trimmed.replace( /\s*\([^)]*\)\s*$/, "" ).trim();
  const withoutBrackets = trimmed.replace( /\s*\[[^\]]*\]\s*$/, "" ).trim();
  const withoutDashSuffix = trimmed.replace( /\s*[-–]\s*[^-–]+$/, "" ).trim();
  const withoutRarityToken = trimmed.replace(
    /\s*\b(UTR|UR|SR|CR|GR|QCR|PCR|PGR|SP|SE|PR|HR|R|C|SCR|SNR|GCR|GUR|GSR)\b\s*$/i,
    ""
  ).trim();

  [ withoutParens, withoutBrackets, withoutDashSuffix, withoutRarityToken ]
    .filter( Boolean )
    .forEach( ( candidate ) => candidates.add( candidate ) );

  return Array.from( candidates );
};

const fetchExactName = async ( name ) => {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${ encodeURIComponent( name ) }&tcgplayer_data=true`;
  const response = await fetch( url );
  const data = await response.json();
  if ( !Array.isArray( data?.data ) || data.data.length === 0 ) {
    return null;
  }
  return data.data[ 0 ];
};

const fetchFuzzyName = async ( name ) => {
  const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${ encodeURIComponent( name ) }&tcgplayer_data=true`;
  const response = await fetch( url );
  const data = await response.json();
  return Array.isArray( data?.data ) ? data.data : [];
};

const pickBestMatch = ( matches, candidates ) => {
  if ( !Array.isArray( matches ) || matches.length === 0 ) {
    return null;
  }

  const candidateKeys = new Set( candidates.map( normalizeNameKey ).filter( Boolean ) );
  if ( candidateKeys.size === 0 ) {
    return matches[ 0 ];
  }

  const exact = matches.find( ( card ) => candidateKeys.has( normalizeNameKey( card?.name ) ) );
  return exact || matches[ 0 ];
};

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

export default async function handler( req, res ) {
  const { name } = req.query;
  const normalizedName = Array.isArray( name ) ? name[ 0 ] : name;

  if ( !normalizedName ) {
    return res.status( 400 ).json( { error: "Missing card name" } );
  }

  const candidates = buildNameCandidates( normalizedName );
  if ( candidates.length === 0 ) {
    return res.status( 400 ).json( { error: "Missing card name" } );
  }

  try {
    let card = null;

    for ( const candidate of candidates ) {
      card = await fetchExactName( candidate );
      if ( card ) {
        break;
      }
    }

    if ( !card ) {
      const fallbackName = candidates[ candidates.length - 1 ];
      const fuzzyMatches = await fetchFuzzyName( fallbackName );
      card = pickBestMatch( fuzzyMatches, candidates );
    }

    if ( !card ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    res.status( 200 ).json( formatCard( card ) );
  } catch ( error ) {
    console.error( "Card lookup failed:", error );
    res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
