import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    if ( req.method !== "POST" ) {
        return res.status( 405 ).json( { error: "Method not allowed" } );
    }

    const { cardId } = req.query;
    const { price } = req.body;

    if ( !cardId || !price ) {
        return res.status( 400 ).json( { error: "Missing required parameters" } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        // Check existing price history
        const priceHistoryDoc = await db.collection( "priceHistory" ).findOne( { cardId } );

        // If no history, create new entry
        if ( !priceHistoryDoc ) {
            await db.collection( "priceHistory" ).insertOne( {
                cardId,
                history: [ { date: new Date().toISOString(), price } ],
            } );
        } else {
            // Add new price entry only if it's different from the last recorded price
            const lastEntry = priceHistoryDoc.history[ 0 ];

            if ( !lastEntry || lastEntry.price !== price ) {
                await db.collection( "priceHistory" ).updateOne(
                    { cardId },
                    { $push: { history: { date: new Date().toISOString(), price } } }
                );
            }
        }

        await client.close();
        res.status( 200 ).json( { message: "Price history updated successfully" } );
    } catch ( error ) {
        console.error( "Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
