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

        // Fetch price history from "priceHistory" collection
        let priceHistoryDoc = await db.collection( "priceHistory" ).findOne( {
            cardId: { $eq: cardId },
            setName: { $eq: set },
            rarity: { $eq: rarity },
            edition: { $eq: edition }
        } );

        // Fetch price history from "myCollection" (user-specific data)
        const userHistoryDoc = await db.collection( "myCollection" ).findOne(
            { _id: cardId },
            { projection: { priceHistory: 1 } }
        );

        const globalHistory = priceHistoryDoc?.history || [];
        const userHistory = userHistoryDoc?.priceHistory || [];
        let combinedHistory = [ ...globalHistory, ...userHistory ];

        // If no history exists, fetch price from YGOPRODeck API and create entry
        if ( combinedHistory.length === 0 ) {
            console.log( `🔍 No price history found for ${ cardId }. Fetching initial price...` );

            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( cardId ) }&tcgplayer_data=true`;
            const response = await fetch( url );
            const data = await response.json();

            if ( !data || !data.data || data.data.length === 0 ) {
                await client.close();
                return res.status( 404 ).json( { error: "Card not found in external API" } );
            }

            const card = data.data[ 0 ];
            const matchingSet = card.card_sets?.find(
                ( s ) => s.set_name === set && s.set_rarity === rarity && s.set_edition === edition
            );

            if ( !matchingSet || !matchingSet.set_price ) {
                await client.close();
                return res.status( 404 ).json( { error: "Set price not available" } );
            }

            const initialPrice = parseFloat( matchingSet.set_price );

            if ( isNaN( initialPrice ) ) {
                console.error( "❌ Invalid price detected." );
                await client.close();
                return res.status( 500 ).json( { error: "Invalid price data" } );
            }

            // Create initial price history entry
            const newEntry = { date: new Date().toISOString(), price: initialPrice };
            priceHistoryDoc = {
                cardId,
                setName: set,
                rarity,
                edition,
                history: [ newEntry ]
            };

            await db.collection( "priceHistory" ).insertOne( priceHistoryDoc );
            combinedHistory = [ newEntry ]; // Update history for response
        }

        // Sort history by date
        combinedHistory = combinedHistory
            .filter( entry => entry.price !== null && entry.price !== undefined )
            .map( entry => ( {
                date: new Date( entry.date ).toISOString().split( "T" )[ 0 ], // Standardize date format
                price: parseFloat( entry.price )
            } ) )
            .sort( ( a, b ) => new Date( a.date ) - new Date( b.date ) );

        await client.close();
        res.status( 200 ).json( { priceHistory: combinedHistory } );
    } catch ( error ) {
        console.error( "❌ Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
