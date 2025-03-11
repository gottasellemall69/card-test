import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    if ( req.method !== "POST" ) {
        return res.status( 405 ).json( { error: "Method not allowed" } );
    }

    const { cardId, setCode, setEdition, price } = req.body;

    if ( !cardId || !setCode || !setEdition || price == null ) {
        return res.status( 400 ).json( { error: "Missing parameters" } );
    }

    const client = new MongoClient( process.env.MONGODB_URI );

    try {
        await client.connect();
        const db = client.db( "cardPriceApp" );
        const collection = db.collection( "priceHistory" );

        const now = new Date();
        const TWELVE_HOURS = 12 * 60 * 60 * 1000;

        const existingRecord = await collection.findOne( { cardId: { $eq: cardId }, productName, setName, setCode: { $eq: setCode }, rarity, setEdition: { $eq: setEdition }, condition } );

        if ( !existingRecord ) {
            await collection.insertOne( {
                cardId,
                productName,
                setName,
                setCode,
                rarity,
                setEdition,
                condition,
                history: [ { date: now.toISOString(), price } ],
            } );
        } else {
            const lastEntry = existingRecord.history[ existingRecord.history.length - 1 ];
            const lastUpdate = new Date( lastEntry.date );

            if ( now - lastUpdate >= TWELVE_HOURS ) {
                await collection.updateOne(
                    { cardId: { $eq: cardId }, productName, setName, setCode: { $eq: setCode }, rarity, setEdition: { $eq: setEdition }, condition },
                    { $push: { history: { date: now.toISOString(), price } } }
                );
            }
        }

        res.status( 200 ).json( { message: "Price updated" } );
    } catch ( error ) {
        console.error( "Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    } finally {
        await client.close();
    }
}
