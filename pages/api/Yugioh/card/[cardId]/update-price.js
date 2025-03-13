import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    if ( req.method !== "POST" ) {
        return res.status( 405 ).json( { error: "Method Not Allowed" } );
    }

    const { cardId, setName, rarity, edition, newPrice } = req.body;

    if ( !cardId || !setName || !rarity || !edition || isNaN( newPrice ) ) {
        return res.status( 400 ).json( { error: "Missing or invalid parameters" } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        const priceHistoryCollection = db.collection( "priceHistory" );

        const existingDoc = await priceHistoryCollection.findOne( {
            cardId, setName, rarity, edition
        } );

        if ( !existingDoc ) {
            const newDoc = {
                cardId,
                setName,
                rarity,
                edition,
                history: [ { date: new Date().toISOString(), price: parseFloat( newPrice ) } ],
            };
            await priceHistoryCollection.insertOne( newDoc );
        } else {
            await priceHistoryCollection.updateOne(
                { cardId, setName, rarity, edition },
                { $push: { history: { date: new Date().toISOString(), price: parseFloat( newPrice ) } } },
                { $upsert: true },

            );
        }

        await client.close();
        res.status( 200 ).json( { message: "Price updated successfully" } );
    } catch ( error ) {
        console.error( "❌ Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
