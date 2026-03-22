import { buildCardNameKeys } from "@/utils/yugiohCardNameVariants";
import { formatYugiohCardData } from "@/utils/formatYugiohCardData";

const normalizeToken = ( value ) =>
  ( value ?? "" ).toString().toLowerCase().replace( /[^a-z0-9]+/g, "" ).trim();

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

  const requestedKeys = new Set( buildCardNameKeys( cardName ) );

  const codeMatches = cards.filter( ( card ) =>
    Array.isArray( card?.card_sets ) &&
    card.card_sets.some( ( set ) => matchesSetCode( set?.set_code, setCode ) )
  );

  if ( codeMatches.length === 0 ) {
    return null;
  }

  if ( requestedKeys.size > 0 ) {
    const exactName = codeMatches.find( ( card ) =>
      buildCardNameKeys( card?.name ).some( ( key ) => requestedKeys.has( key ) )
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

    return res.status( 200 ).json( formatYugiohCardData( match ) );
  } catch ( error ) {
    console.error( "Set lookup failed:", error );
    return res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
