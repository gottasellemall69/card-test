export default async function handler( req, res ) {
  if ( req.method !== "GET" ) {
    return res.status( 405 ).json( { message: "Method not allowed" } );
  }

  const { search, archetype } = req.query;

  if ( !search && !archetype ) {
    return res.status( 400 ).json( { message: "Search query is required" } );
  }

  try {
    let url;
    if ( archetype ) {
      url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?archetype=${ encodeURIComponent( archetype ) }`;
    } else {
      url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${ encodeURIComponent( search ) }&tcgplayer_data=true`;
    }

    const response = await fetch( url );
    const data = await response.json();

    if ( !data.data || data.data.length === 0 ) {
      return res.status( 404 ).json( { message: "Card not found" } );
    }

    if ( search ) {
      const searchedCard = data.data[ 0 ];
      const relatedCards = data.data.filter( ( card ) => card.archetype === searchedCard.archetype );
      return res.status( 200 ).json( { searchedCard, relatedCards } );
    }

    return res.status( 200 ).json( { relatedCards: data.data } );
  } catch ( error ) {
    console.error( error );
    return res.status( 500 ).json( { message: "Internal server error" } );
  }
}
