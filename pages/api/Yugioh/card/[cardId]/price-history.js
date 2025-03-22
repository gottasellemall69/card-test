import { MongoClient } from 'mongodb';
export default async function handler( req, res ) {
    const { cardId, set, rarity, edition } = req.query;

    if ( !cardId || !set || !rarity || !edition ) {
        return res.status( 400 ).json( { error: "Missing parameters: cardId, set, rarity, edition" } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        // Fetch user-specific price history from "myCollection"
        const userDoc = await db.collection( "myCollection" ).findOne(
            { setName: set, rarity, printing: edition },
            { projection: { priceHistory: 1, _id: 0 } }
        );

        // Fetch global price history from "priceHistory"
        const globalDoc = await db.collection( "priceHistory" ).findOne(
            { cardId, setName: set, rarity, edition },
            { projection: { history: 1, _id: 0 } }
        );

        // Extract history arrays
        const userHistory = userDoc?.priceHistory || [];
        const globalHistory = globalDoc?.history || [];

        // Combine and sort history
        let combinedHistory = [ ...userHistory, ...globalHistory ]
            .map( entry => ( {
                date: new Date( entry.date ).toISOString().split( "T" )[ 0 ], // Standardize format
                price: parseFloat( entry.price )
            } ) )
            .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

        await client.close();
        return res.status( 200 ).json( { priceHistory: combinedHistory } );
    } catch ( error ) {
        console.error( "❌ Database Error:", error );
        return res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
