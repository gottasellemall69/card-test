import clientPromise from "@/utils/mongo";
import {
    buildHistoryFilter,
    fetchPriceHistory,
    mergeLegacyHistory,
    recordPriceHistoryEntry,
} from "@/utils/priceHistoryStore";

export default async function handler( req, res ) {
    const { cardId, set, number, rarity, edition } = req.query;
    if ( !cardId || !set || !number || !rarity || !edition ) {
        return res
            .status( 400 )
            .json( { error: "Missing parameters: cardId, set, number, rarity, edition" } );
    }

    try {
        const db = ( await clientPromise ).db( "cardPriceApp" );
        const filter = buildHistoryFilter( {
            cardId,
            setName: set,
            number,
            rarity,
            edition,
        } );

        // Prefer dedicated collection
        let history = await fetchPriceHistory( filter );

        // One-time merge from legacy inline history if present
        if ( !history.length ) {
            const legacy = await db.collection( "myCollection" ).findOne(
                { setName: set, number, rarity, printing: edition },
                { projection: { priceHistory: 1, _id: 0 } }
            );
            if ( legacy?.priceHistory?.length ) {
                await mergeLegacyHistory( { filter, entries: legacy.priceHistory } );
                history = await fetchPriceHistory( filter );
            }
        }

        // Bootstrap with external price if still empty
        if ( !history.length ) {
            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ encodeURIComponent(
                cardId
            ) }&tcgplayer_data=true`;
            const response = await fetch( url );
            const data = await response.json();

            const card = data?.data?.[ 0 ];
            const matchingSet = card?.card_sets?.find(
                ( s ) =>
                    s.set_name === set &&
                    s.set_code === number &&
                    s.set_rarity === rarity &&
                    s.set_edition === edition
            );

            const initialPrice = matchingSet?.set_price ? parseFloat( matchingSet.set_price ) : null;
            if ( Number.isFinite( initialPrice ) ) {
                await recordPriceHistoryEntry( {
                    cardId,
                    setName: set,
                    number,
                    rarity,
                    edition,
                    price: initialPrice,
                } );
                history = await fetchPriceHistory( filter );
            }
        }

        return res.status( 200 ).json( { priceHistory: history } );
    } catch ( error ) {
        console.error( "price-history error:", error );
        return res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
