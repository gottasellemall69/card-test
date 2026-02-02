import { requireUser } from "@/proxy/authenticate";
import clientPromise from "@/utils/mongo";
import { ensureSafeUserId } from "@/utils/securityValidators";
import { buildHistoryFilter, fetchPriceHistory } from "@/utils/priceHistoryStore";

const toTimestampKey = ( value ) => {
  const date = new Date( value );
  if ( Number.isNaN( date.getTime() ) ) return null;
  return date.toISOString();
};

export default async function handler( req, res ) {
  if ( req.method !== "GET" ) {
    res.setHeader( "Allow", [ "GET" ] );
    return res.status( 405 ).end( `Method ${ req.method } Not Allowed` );
  }

  const auth = await requireUser( req, res );
  if ( !auth ) {
    return;
  }

  try {
    const userId = ensureSafeUserId( auth.decoded.username );
    const client = await clientPromise;
    const collection = client.db( "cardPriceApp" ).collection( "myCollection" );
    const cards = await collection
      .find( { userId } )
      .project( {
        cardId: 1,
        setName: 1,
        number: 1,
        printing: 1,
        rarity: 1,
        quantity: 1,
        marketPrice: 1,
      } )
      .toArray();

    if ( !cards.length ) {
      return res.status( 200 ).json( { history: [] } );
    }

    const nowKey = toTimestampKey( new Date() );

    const histories = await Promise.all(
      cards.map( async ( card ) => {
        const quantity = Number( card?.quantity ) || 0;
        if ( quantity <= 0 ) {
          return null;
        }

        const filter = buildHistoryFilter( {
          cardId: card?.cardId ?? null,
          setName: card?.setName,
          number: card?.number,
          rarity: card?.rarity,
          edition: card?.printing,
        } );

        let history = await fetchPriceHistory( filter );

        if ( ( !history || history.length === 0 ) && Number.isFinite( Number( card?.marketPrice ) ) && nowKey ) {
          history = [ { date: nowKey, price: Number( card.marketPrice ) } ];
        }

        return { quantity, history: history || [] };
      } )
    );

    const dateSet = new Set();
    const normalized = histories
      .filter( Boolean )
      .map( ( entry ) => {
        const historyByDate = new Map();
        entry.history.forEach( ( point ) => {
          const dateKey = toTimestampKey( point?.date );
          const price = Number( point?.price );
          if ( !dateKey || !Number.isFinite( price ) ) {
            return;
          }
          historyByDate.set( dateKey, price );
          dateSet.add( dateKey );
        } );
        return { quantity: entry.quantity, historyByDate };
      } );

    if ( dateSet.size === 0 ) {
      return res.status( 200 ).json( { history: [] } );
    }

    const sortedDates = Array.from( dateSet ).sort( ( a, b ) => new Date( a ) - new Date( b ) );
    const totals = new Map( sortedDates.map( ( date ) => [ date, 0 ] ) );

    normalized.forEach( ( entry ) => {
      let lastPrice = null;
      sortedDates.forEach( ( dateKey ) => {
        if ( entry.historyByDate.has( dateKey ) ) {
          lastPrice = entry.historyByDate.get( dateKey );
        }
        if ( Number.isFinite( lastPrice ) ) {
          totals.set( dateKey, ( totals.get( dateKey ) || 0 ) + lastPrice * entry.quantity );
        }
      } );
    } );

    const history = sortedDates
      .map( ( date ) => ( {
        date,
        value: Number( totals.get( date ) || 0 ),
      } ) )
      .filter( ( entry ) => Number.isFinite( entry.value ) );

    return res.status( 200 ).json( { history } );
  } catch ( error ) {
    console.error( "collection value history error:", error );
    return res.status( 500 ).json( { error: "Internal Server Error" } );
  }
}
