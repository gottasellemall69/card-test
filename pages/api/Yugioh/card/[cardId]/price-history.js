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

        // Fetch user-specific price history from "myCollection"
        const userDoc = await db.collection( "myCollection" ).findOne(
            { setName: { $eq: set }, rarity: { $eq: rarity }, printing: { $eq: edition } },
            { projection: { priceHistory: 1, _id: 0 } }
        );

        // Fetch global price history from "priceHistory"
        const globalDoc = await db.collection( "priceHistory" ).findOne(
            { cardId: { $eq: cardId }, setName: { $eq: set }, rarity: { $eq: rarity }, edition: { $eq: edition } },
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

        // ✅ If no history exists, fetch price from YGOPRODeck API
        if ( combinedHistory.length === 0 ) {
            console.log( `🔍 No price history found for ${ cardId }. Fetching initial price...` );

            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( cardId ) }&tcgplayer_data=true`;
            const response = await fetch( url );
            const data = await response.json();

            if ( !data?.data || data?.data.length === 0 ) {
                await client.close();
                return res.status( 404 ).json( { error: "Card not found in external API" } );
            }

            const card = data.data[ 0 ];
            const matchingSet = card?.card_sets?.find(
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

            // ✅ Create initial price history entry
            const newEntry = { date: new Date().toISOString(), price: initialPrice };

            await db.collection( "priceHistory" ).insertOne( {
                cardId,
                setName: set,
                rarity,
                edition,
                history: [ newEntry ]
            } );

            combinedHistory = [ newEntry ]; // Update history for response
        } else {
            // ✅ Fetch the latest price if the last recorded date is not today
            const lastEntry = combinedHistory[ combinedHistory.length - 1 ];
            const lastEntryDate = new Date( lastEntry.date ).toISOString().split( "T" )[ 0 ];
            const todayDate = new Date().toISOString().split( "T" )[ 0 ];

            if ( lastEntryDate !== todayDate ) {
                console.log( `🔍 Fetching latest price for ${ cardId }...` );

                const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent( cardId ) }&tcgplayer_data=true`;
                const response = await fetch( url );
                const data = await response.json();

                if ( data?.data?.length > 0 ) {
                    const card = data.data[ 0 ];
                    const matchingSet = card?.card_sets?.find(
                        ( s ) => s.set_name === set && s.set_rarity === rarity && s.set_edition === edition
                    );

                    if ( matchingSet?.set_price ) {
                        const latestPrice = parseFloat( matchingSet.set_price );

                        if ( !isNaN( latestPrice ) ) {
                            console.log( `✅ Adding new price entry for ${ todayDate }: $${ latestPrice }` );

                            await db.collection( "priceHistory" ).updateOne(
                                { cardId: { $eq: cardId }, setName: { $eq: set }, rarity: { $eq: rarity }, edition: { $eq: edition } },
                                { $push: { history: { date: new Date().toISOString(), price: latestPrice } } },
                                { upsert: true }
                            );

                            combinedHistory.push( { date: todayDate, price: latestPrice } );
                        }
                    }
                }
            }
        }

        await client.close();
        res.status( 200 ).json( { priceHistory: combinedHistory } );
    } catch ( error ) {
        console.error( "❌ Database Error:", error );
        res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
