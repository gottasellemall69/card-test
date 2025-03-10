import { MongoClient } from "mongodb";

const client = new MongoClient( process.env.MONGODB_URI );

export default async function handler( req, res ) {
    const { cardId } = req.query;
    const setCode = req.query.set;

    if ( !cardId || !setCode ) {
        return res.status( 400 ).json( { error: "Missing card ID or set code" } );
    }

    try {
        await client.connect();
        const db = client.db( "cardPriceApp" );
        const collection = db.collection( "priceHistory" );

        // Fetch existing price history
        const history = await collection.findOne( { cardId, setCode } );

        if ( history ) {
            const lastUpdate = new Date( history.lastUpdated );
            const now = new Date();

            // Check if 12 hours have passed since last update
            if ( ( now - lastUpdate ) / ( 1000 * 60 * 60 ) < 12 ) {
                return res.status( 200 ).json( { priceHistory: history.history } );
            }
        }

        // Fetch current price from API
        const response = await fetch( `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ cardId }&tcgplayer_data=true` );
        const data = await response.json();

        if ( !data.data || data.data.length === 0 ) {
            return res.status( 404 ).json( { error: "Card not found" } );
        }

        // Find the selected set's price
        const selectedSet = data.data[ 0 ].card_sets.find( ( set ) => set.set_code === setCode );
        if ( !selectedSet ) {
            return res.status( 404 ).json( { error: "Set not found for this card" } );
        }

        const newPriceEntry = { date: new Date().toISOString(), price: parseFloat( selectedSet.set_price ) || 0 };

        // Update or insert price history
        await collection.updateOne(
            { cardId, setCode },
            {
                $set: { lastUpdated: new Date().toISOString() },
                $push: { history: { $each: [ newPriceEntry ], $position: 0 } },
            },
            { upsert: true }
        );

        res.status( 200 ).json( { priceHistory: history ? [ ...history.history, newPriceEntry ] : [ newPriceEntry ] } );
    } catch ( error ) {
        console.error( "Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    } finally {
        await client.close();
    }
}
