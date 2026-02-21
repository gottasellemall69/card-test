import { requireUser } from "@/proxy/authenticate";
import clientPromise from "@/utils/mongo";
import { ensureSafeUserId } from "@/utils/securityValidators";
import { buildHistoryFilter } from "@/utils/priceHistoryStore";

const toTimestampKey = ( value ) => {
  const date = new Date( value );
  if ( Number.isNaN( date.getTime() ) ) return null;
  return date.toISOString();
};

const toDayKey = ( value ) => {
  const timestamp = toTimestampKey( value );
  if ( !timestamp ) return null;
  return timestamp.split( "T" )[ 0 ];
};

const buildSignatureKey = ( signature ) =>
  [
    signature?.setName ?? "",
    signature?.number ?? "",
    signature?.rarity ?? "",
    signature?.edition ?? "",
  ].join( "|" );

const mergeHistoryEntries = ( histories = [] ) => {
  const historyByDay = new Map();

  histories.forEach( ( history ) => {
    if ( !Array.isArray( history ) ) {
      return;
    }

    history.forEach( ( point ) => {
      const timestamp = toTimestampKey( point?.date );
      const day = toDayKey( point?.date );
      const price = Number( point?.price );
      if ( !timestamp || !day || !Number.isFinite( price ) ) {
        return;
      }

      const existing = historyByDay.get( day );
      if ( !existing || timestamp > existing.timestamp ) {
        historyByDay.set( day, { timestamp, price } );
      }
    } );
  } );

  return Array.from( historyByDay.entries() )
    .map( ( [ date, entry ] ) => ( { date, price: entry.price } ) )
    .sort( ( a, b ) => a.date.localeCompare( b.date ) );
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
    const priceHistoryCollection = client.db( "cardPriceApp" ).collection( "priceHistory" );
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

    const nowDay = toDayKey( new Date() );

    const activeCards = cards
      .map( ( card ) => {
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
        const signature = {
          setName: filter.setName,
          number: filter.number,
          rarity: filter.rarity,
          edition: filter.edition,
        };

        return {
          quantity,
          marketPrice: Number( card?.marketPrice ),
          signature,
          signatureKey: buildSignatureKey( signature ),
        };
      } )
      .filter( Boolean );

    if ( activeCards.length === 0 ) {
      return res.status( 200 ).json( { history: [] } );
    }

    const uniqueSignatureMap = new Map();
    activeCards.forEach( ( card ) => {
      if ( !uniqueSignatureMap.has( card.signatureKey ) ) {
        uniqueSignatureMap.set( card.signatureKey, card.signature );
      }
    } );

    const uniqueSignatures = Array.from( uniqueSignatureMap.values() );
    const matchingHistories = uniqueSignatures.length > 0
      ? await priceHistoryCollection
        .find( { $or: uniqueSignatures }, {
          projection: {
            setName: 1,
            number: 1,
            rarity: 1,
            edition: 1,
            history: 1,
            _id: 0,
          },
        } )
        .toArray()
      : [];

    const historyBySignature = new Map();
    matchingHistories.forEach( ( doc ) => {
      const signature = buildHistoryFilter( {
        cardId: null,
        setName: doc?.setName,
        number: doc?.number,
        rarity: doc?.rarity,
        edition: doc?.edition,
      } );
      const key = buildSignatureKey( {
        setName: signature?.setName,
        number: signature?.number,
        rarity: signature?.rarity,
        edition: signature?.edition,
      } );

      if ( !historyBySignature.has( key ) ) {
        historyBySignature.set( key, [] );
      }

      historyBySignature.get( key ).push( doc?.history || [] );
    } );

    const histories = activeCards.map( ( card ) => {
      let history = mergeHistoryEntries( historyBySignature.get( card.signatureKey ) || [] );

      if ( ( !history || history.length === 0 ) && Number.isFinite( card.marketPrice ) && nowDay ) {
        history = [ { date: nowDay, price: card.marketPrice } ];
      }

      return {
        quantity: card.quantity,
        history: history || [],
      };
    } );

    const dateSet = new Set();
    const normalized = histories
      .filter( Boolean )
      .map( ( entry ) => {
        const historyByDate = new Map();
        entry.history.forEach( ( point ) => {
          const dateKey = toDayKey( point?.date );
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

    const sortedDates = Array.from( dateSet ).sort( ( a, b ) => a.localeCompare( b ) );
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
