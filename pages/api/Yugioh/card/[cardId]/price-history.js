import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    const { cardId } = req.query;

    if ( !cardId ) {
        return res.status( 400 ).json( { error: "Missing card ID" } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        // 🔍 Check if price history exists
        let priceHistoryDoc = await db.collection( "priceHistory" ).findOne( { cardId } );

        if ( !priceHistoryDoc ) {
            console.log( `⚠️ No price history found for ${ cardId }, fetching current price...` );

            // 🔄 Fetch the current price from external API
            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ cardId }&tcgplayer_data=true`;
            const response = await fetch( url );
            const data = await response.json();

            if ( !data || !data.data || data.data.length === 0 ) {
                return res.status( 404 ).json( { error: "Card not found" } );
            }

            const card = data.data[ 0 ];
            const initialPrice = parseFloat( card.card_sets?.set_price || "0" );

            // 🆕 Store the new price history entry
            priceHistoryDoc = {
                cardId,
                history: [ { date: new Date().toISOString(), price: initialPrice } ],
            };

            await db.collection( "priceHistory" ).insertOne( priceHistoryDoc );
            console.log( `✅ Created initial price history for ${ cardId }` );
        }

        await client.close();
        res.status( 200 ).json( { priceHistory: priceHistoryDoc.history } );
    } catch ( error ) {
        console.error( "❌ Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
