import { buildCardNameCandidates, buildCardNameKeys } from "@/utils/yugiohCardNameVariants";
import { formatYugiohCardData } from "@/utils/formatYugiohCardData";

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

const pickBestMatch = ( matches, requestedName ) => {
  if ( !Array.isArray( matches ) || matches.length === 0 ) {
    return null;
  }

  const candidateKeys = new Set( buildCardNameKeys( requestedName ) );
  if ( candidateKeys.size === 0 ) {
    return matches[ 0 ];
  }

  const exact = matches.find( ( card ) =>
    buildCardNameKeys( card?.name ).some( ( key ) => candidateKeys.has( key ) )
  );
  return exact || matches[ 0 ];
};

export default async function handler( req, res ) {
  const { name } = req.query;
  const normalizedName = Array.isArray( name ) ? name[ 0 ] : name;

  if ( !normalizedName ) {
    return res.status( 400 ).json( { error: "Missing card name" } );
  }

  const candidates = buildCardNameCandidates( normalizedName );
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
      const fallbackName = candidates[ candidates.length - 1 ] || normalizedName;
      const fuzzyMatches = await fetchFuzzyName( fallbackName );
      card = pickBestMatch( fuzzyMatches, normalizedName );
    }

    if ( !card ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    res.status( 200 ).json( formatYugiohCardData( card ) );
  } catch ( error ) {
    console.error( "Card lookup failed:", error );
    res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
