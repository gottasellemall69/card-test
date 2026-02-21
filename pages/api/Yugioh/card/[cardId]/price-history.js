import clientPromise from "@/utils/mongo";
import {
    buildHistoryFilter,
    mergeLegacyHistory,
    recordPriceHistoryEntry,
} from "@/utils/priceHistoryStore";

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

const mergeHistoryEntries = ( histories = [] ) => {
    const byDay = new Map();

    histories.forEach( ( history ) => {
        if ( !Array.isArray( history ) ) {
            return;
        }

        history.forEach( ( entry ) => {
            const date = toTimestampKey( entry?.date );
            const day = toDayKey( entry?.date );
            const price = Number( entry?.price );
            if ( !date || !day || !Number.isFinite( price ) ) {
                return;
            }

            const current = byDay.get( day );
            if ( !current || date > current.date ) {
                byDay.set( day, { date, price } );
            }
        } );
    } );

    return Array.from( byDay.values() )
        .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) )
        .map( ( entry ) => ( { date: entry.date, price: entry.price } ) );
};

export default async function handler( req, res ) {
    const { cardId, set, number, rarity, edition } = req.query;
    if ( !cardId || !set || !number || !rarity || !edition ) {
        return res
            .status( 400 )
            .json( { error: "Missing parameters: cardId, set, number, rarity, edition" } );
    }

    try {
        const db = ( await clientPromise ).db( "cardPriceApp" );
        const priceHistoryCollection = db.collection( "priceHistory" );
        const filter = buildHistoryFilter( {
            cardId,
            setName: set,
            number,
            rarity,
            edition,
        } );
        const signatureFilter = {
            setName: filter.setName,
            number: filter.number,
            rarity: filter.rarity,
            edition: filter.edition,
        };
        const getMergedHistory = async () => {
            const docs = await priceHistoryCollection
                .find( signatureFilter, { projection: { history: 1, _id: 0 } } )
                .toArray();
            return mergeHistoryEntries( docs.map( ( doc ) => doc?.history ) );
        };

        let history = await getMergedHistory();

        // One-time merge from legacy inline history if present
        if ( !history.length ) {
            const legacy = await db.collection( "myCollection" ).findOne(
                { setName: set, number, rarity, printing: edition },
                { projection: { priceHistory: 1, _id: 0 } }
            );
            if ( legacy?.priceHistory?.length ) {
                await mergeLegacyHistory( { filter, entries: legacy.priceHistory } );
                history = await getMergedHistory();
            }
        }

        // Track one snapshot per day whenever this endpoint is hit.
        const today = toDayKey( new Date() );
        const lastDay = history.length ? toDayKey( history[ history.length - 1 ]?.date ) : null;

        if ( today && lastDay !== today ) {
            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent(
                cardId
            ) }&tcgplayer_data=true`;
            const response = await fetch( url );
            const data = await response.json();

            const card = data?.data?.[ 0 ];
            const matchingSet = card?.card_sets?.find(
                ( s ) =>
                    s.set_name === set &&
                    s.set_code === number &&
                    s.set_rarity === rarity &&
                    s.set_edition === edition
            );

            const initialPrice = matchingSet?.set_price ? parseFloat( matchingSet.set_price ) : null;
            if ( Number.isFinite( initialPrice ) ) {
                await recordPriceHistoryEntry( {
                    cardId,
                    setName: set,
                    number,
                    rarity,
                    edition,
                    price: initialPrice,
                } );
                history = await getMergedHistory();
            }
        }

        return res.status( 200 ).json( { priceHistory: history } );
    } catch ( error ) {
        console.error( "price-history error:", error );
        return res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
