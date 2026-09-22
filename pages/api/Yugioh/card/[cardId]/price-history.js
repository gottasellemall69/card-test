import clientPromise from "@/utils/mongo";
import { getCardData } from "@/utils/api.js";
import {
    buildHistoryFilter,
    mergeLegacyHistory,
    recordPriceHistoryEntry,
} from "@/utils/priceHistoryStore";

const normalizeText = ( value ) =>
    ( value ?? "" ).toString().replace( /\s+/g, " " ).trim().toLowerCase();

const normalizeLooseText = ( value ) =>
    normalizeText( value ).replace( /[^a-z0-9]+/g, " " ).trim();

const normalizeToken = ( value ) =>
    normalizeText( value ).replace( /[^a-z0-9]+/g, "" );

const normalizeEditionKey = ( value ) => {
    const normalized = normalizeLooseText( value );

    if ( !normalized || normalized === "unknown edition" ) {
        return "";
    }

    if ( /\bunlimited\b/.test( normalized ) ) return "unlimited";
    if ( /\b1st\b|\bfirst\b/.test( normalized ) ) return "1st";
    if ( /\blimited\b/.test( normalized ) ) return "limited";

    return normalized.replace( /\bedition\b/g, "" ).replace( /\s+/g, " " ).trim();
};

const normalizeRarityKey = ( value ) => normalizeToken( value );

const matchesSetCode = ( left, right ) => {
    if ( !left || !right ) return false;
    return normalizeToken( left ) === normalizeToken( right );
};

const raritiesMatch = ( left, right ) => {
    const leftKey = normalizeRarityKey( left );
    const rightKey = normalizeRarityKey( right );
    return !leftKey || !rightKey || leftKey === rightKey;
};

const editionsMatch = ( left, right ) => {
    const leftKey = normalizeEditionKey( left );
    const rightKey = normalizeEditionKey( right );
    return !leftKey || !rightKey || leftKey === rightKey;
};

const parsePrice = ( value ) => {
    const numeric = Number.parseFloat( ( value ?? "" ).toString().replace( /[^0-9.-]+/g, "" ) );
    return Number.isFinite( numeric ) ? numeric : null;
};

const extractTcgRows = ( payload ) => {
    if ( Array.isArray( payload ) ) return payload;
    if ( Array.isArray( payload?.results ) ) return payload.results;
    if ( Array.isArray( payload?.result ) ) return payload.result;
    if ( Array.isArray( payload?.data ) ) return payload.data;
    return [];
};

const scoreTcgRow = ( row, { number, rarity, edition } ) => {
    if ( !matchesSetCode( row?.number, number ) ) {
        return null;
    }

    if ( !raritiesMatch( row?.rarity, rarity ) ) {
        return null;
    }

    if ( !editionsMatch( row?.printing, edition ) ) {
        return null;
    }

    const marketPrice = parsePrice( row?.marketPrice );
    const lowPrice = parsePrice( row?.lowPrice );
    const price = marketPrice ?? lowPrice;

    if ( price === null ) {
        return null;
    }

    let score = 40;
    if ( marketPrice !== null ) score += 10;
    if ( normalizeRarityKey( row?.rarity ) && normalizeRarityKey( row?.rarity ) === normalizeRarityKey( rarity ) ) score += 8;
    if ( normalizeEditionKey( row?.printing ) && normalizeEditionKey( row?.printing ) === normalizeEditionKey( edition ) ) score += 5;

    return { price, score };
};

const findTcgPrice = ( payload, target ) => {
    const rows = extractTcgRows( payload );
    let bestMatch = null;

    for ( const row of rows ) {
        const scored = scoreTcgRow( row, target );
        if ( scored && ( !bestMatch || scored.score > bestMatch.score ) ) {
            bestMatch = scored;
        }
    }

    return bestMatch?.price ?? null;
};

const findYgoPrice = ( card, { set, number, rarity, edition } ) => {
    const sets = Array.isArray( card?.card_sets ) ? card.card_sets : [];
    let bestMatch = null;

    for ( const setEntry of sets ) {
        if ( !matchesSetCode( setEntry?.set_code, number ) ) {
            continue;
        }

        if ( !raritiesMatch( setEntry?.set_rarity, rarity ) ) {
            continue;
        }

        if ( !editionsMatch( setEntry?.set_edition, edition ) ) {
            continue;
        }

        const price = parsePrice( setEntry?.set_price );
        if ( price === null ) {
            continue;
        }

        let score = 40;
        if ( normalizeLooseText( setEntry?.set_name ) === normalizeLooseText( set ) ) score += 10;
        if ( normalizeRarityKey( setEntry?.set_rarity ) === normalizeRarityKey( rarity ) ) score += 8;
        if ( normalizeEditionKey( setEntry?.set_edition ) === normalizeEditionKey( edition ) ) score += 5;

        if ( !bestMatch || score > bestMatch.score ) {
            bestMatch = { price, score };
        }
    }

    return bestMatch?.price ?? null;
};

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
            const tcgPayload = await getCardData( set );
            let initialPrice = findTcgPrice( tcgPayload, { number, rarity, edition } );

            if ( initialPrice === null ) {
                const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent(
                    cardId
                ) }`;
                const response = await fetch( url );
                const data = await response.json();
                const card = data?.data?.[ 0 ];
                initialPrice = findYgoPrice( card, { set, number, rarity, edition } );
            }

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
