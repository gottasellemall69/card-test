import { formatYugiohCardData } from "@/utils/formatYugiohCardData";

export default async function handler( req, res ) {
  const { cardId } = req.query;
  const normalizedCardId = Array.isArray( cardId ) ? cardId[ 0 ] : cardId;

  if ( !normalizedCardId ) {
    return res.status( 400 ).json( { error: "Missing card identifier" } );
  }

  try {
    const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( normalizedCardId ) }&tcgplayer_data=true`;
    const response = await fetch( url );
    const data = await response.json();

    if ( !Array.isArray( data?.data ) || data.data.length === 0 ) {
      return res.status( 404 ).json( { error: "Card not found" } );
    }

    const card = data.data?.[ 0 ];
    res.status( 200 ).json( formatYugiohCardData( card ) );
  } catch ( error ) {
    console.error( "Fetching card data failed:", error );
    res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
