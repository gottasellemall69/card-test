import { MongoClient } from "mongodb";

export default async function handler( req, res ) {
    const { cardId, set, rarity, edition } = req.query;

    if ( !cardId || !set || !rarity || !edition ) {
        return res.status( 400 ).json( { error: "Missing parameters: cardId, set, rarity, edition" } );
    }

    try {
        const client = new MongoClient( process.env.MONGODB_URI );
        await client.connect();
        const db = client.db( "cardPriceApp" );

        let priceHistoryDoc = await db.collection( "priceHistory" ).findOne( {
            cardId: { $eq: cardId }, setName: { $eq: set }, rarity: { $eq: rarity }, edition: { $eq: edition }
        } );

        if ( !priceHistoryDoc ) {
            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( cardId ) }&tcgplayer_data=true`;
            const response = await fetch( url );
            const data = await response.json();

            if ( !data || !data.data || data.data.length === 0 ) {
                await client.close();
                return res.status( 404 ).json( { error: "Card not found" } );
            }

            const card = data.data[ 0 ];

            // Find the correct set matching the parameters
            const matchingSet = card.card_sets?.find(
                ( s ) => s.set_name === set && s.set_rarity === rarity && s.set_edition === edition
            );

            if ( !matchingSet ) {
                await client.close();
                return res.status( 404 ).json( { error: "Set not found" } );
            }

            const initialPrice = parseFloat( matchingSet.set_price || 0 );

            if ( isNaN( initialPrice ) ) {
                console.error( "❌ Invalid price detected." );
                await client.close();
                return res.status( 500 ).json( { error: "Invalid price data" } );
            }

            priceHistoryDoc = {
                cardId,
                setName: set,
                rarity,
                edition,
                history: [ { date: new Date().toISOString(), price: initialPrice } ],
            };

            await db.collection( "priceHistory" ).insertOne( priceHistoryDoc );
        }

        await client.close();
        res.status( 200 ).json( { priceHistory: priceHistoryDoc.history } );
    } catch ( error ) {
        console.error( "❌ Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
