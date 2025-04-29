// pages\api\Yugioh\card\[cardId]\update-price.js

import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    if ( req.method !== "POST" ) {
        return res.status( 405 ).json( { error: "Method Not Allowed" } );
    }

    const { cardId, setName, number, rarity, edition, newPrice } = req.body;

    if ( !cardId || !setName || !number || !rarity || !edition || isNaN( newPrice ) ) {
        return res.status( 400 ).json( { error: "Missing or invalid parameters" } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        const priceHistoryCollection = db.collection( "priceHistory" );

        const existingDoc = await priceHistoryCollection.findOne( {
            cardId: { $eq: cardId }, setName: { $eq: setName }, number: { $eq: number }, rarity: { $eq: rarity }, edition: { $eq: edition }
        } );

        if ( !existingDoc ) {
            const newDoc = {
                cardId,
                setName,
                number,
                rarity,
                edition,
                history: [ { date: new Date().toISOString(), price: parseFloat( newPrice ) } ],
            };
            await priceHistoryCollection.insertOne( newDoc );
        } else {
            await priceHistoryCollection.updateOne(
                { cardId: { $eq: cardId }, setName: { $eq: setName }, number: { $eq: number }, rarity: { $eq: rarity }, edition: { $eq: edition } },
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
