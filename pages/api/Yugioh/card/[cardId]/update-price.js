import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    console.log( "🚀 API endpoint hit for cardId:", req.query.cardId ); // Add this log to see if the cardId is correctly parsed
    if ( req.method !== "POST" ) {
        return res.status( 405 ).json( { error: "Method Not Allowed" } );
    }

    const { cardId, card, set, rarity, newPrice } = req.body;

    console.log( "🔍 Received price update request:", req.body );

    if ( !card || !set || !rarity || !printing || !newPrice ) {
        return res.status( 400 ).json( {
            error: "Missing required fields",
            missingFields: {
                cardId: cardId,
                newPrice: newPrice || "MISSING",
            },
        } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        const priceHistoryCollection = db.collection( "priceHistory" );

        const priceHistoryDoc = await priceHistoryCollection.findOne( { cardId: { $eq: cardId } } );

        if ( !priceHistoryDoc ) {
            return res.status( 404 ).json( { error: "Card price history not found" } );
        }

        const updatedHistory = [
            ...priceHistoryDoc.history,
            { date: new Date().toISOString(), price: parseFloat( newPrice ) },
        ];

        await priceHistoryCollection.updateOne(
            { cardId: { $eq: cardId } },
            { $set: { price: updatedHistory } }
        );

        console.log( `✅ Price updated for ${ card }: $${ newPrice }` );

        await client.close();
        res.status( 200 ).json( { message: "Price updated successfully", updatedHistory } );
    } catch ( error ) {
        console.error( "❌ Update Price Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
