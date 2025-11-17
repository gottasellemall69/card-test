import clientPromise from "@/utils/mongo";

const COLLECTION = "priceHistory";
const normalize = ( v ) => ( v ?? "" ).toString().trim();
const normalizeEdition = ( v ) => normalize( v ) || "Unknown Edition";

export const buildHistoryFilter = ( { cardId, setName, number, rarity, edition } ) => ( {
    cardId: normalize( cardId ) || null,
    setName: normalize( setName ),
    number: normalize( number ),
    rarity: normalize( rarity ),
    edition: normalizeEdition( edition ),
} );

export async function recordPriceHistoryEntry( {
    cardId,
    setName,
    number,
    rarity,
    edition,
    price,
    date = new Date(),
} ) {
    const numericPrice = Number( price );
    if ( !Number.isFinite( numericPrice ) ) return { matchedCount: 0, modifiedCount: 0 };

    const db = ( await clientPromise ).db( "cardPriceApp" );
    const filter = buildHistoryFilter( { cardId, setName, number, rarity, edition } );
    const entry = { date: new Date( date ), price: numericPrice };

    return db.collection( COLLECTION ).updateOne(
        filter,
        {
            $push: { history: entry }, // creates array if missing
            $set: { lastPrice: entry.price, updatedAt: new Date() },
            $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
    );
}

export async function fetchPriceHistory( filter ) {
    const db = ( await clientPromise ).db( "cardPriceApp" );
    const doc = await db.collection( COLLECTION ).findOne( filter, { projection: { history: 1, _id: 0 } } );

    return ( doc?.history ?? [] )
        .map( ( h ) => ( {
            date: new Date( h.date ).toISOString(),
            price: Number( h.price ),
        } ) )
        .filter( ( h ) => Number.isFinite( h.price ) )
        .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );
}

export async function mergeLegacyHistory( { filter, entries = [] } ) {
    if ( !entries.length ) return;

    const formatted = entries
        .filter( ( e ) => e && e.price !== undefined )
        .map( ( e ) => ( {
            date: new Date( e.date ?? Date.now() ),
            price: Number( e.price ),
        } ) )
        .filter( ( e ) => Number.isFinite( e.price ) );

    if ( !formatted.length ) return;

    const db = ( await clientPromise ).db( "cardPriceApp" );
    await db.collection( COLLECTION ).updateOne(
        filter,
        {
            $push: { history: { $each: formatted } },
            $set: { updatedAt: new Date() },
            $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
    );
}
