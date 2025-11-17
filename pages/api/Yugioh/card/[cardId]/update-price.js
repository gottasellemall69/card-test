import { recordPriceHistoryEntry, buildHistoryFilter } from "@/utils/priceHistoryStore";

export default async function handler( req, res ) {
    if ( req.method !== "POST" ) {
        return res.status( 405 ).json( { error: "Method Not Allowed" } );
    }

    const { cardId, setName, number, rarity, edition, newPrice } = req.body;
    const numericPrice = Number( newPrice );
    if ( !cardId || !setName || !number || !rarity || !edition || !Number.isFinite( numericPrice ) ) {
        return res.status( 400 ).json( { error: "Missing or invalid parameters" } );
    }

    try {
        await recordPriceHistoryEntry( {
            cardId,
            setName,
            number,
            rarity,
            edition,
            price: numericPrice,
        } );

        return res.status( 200 ).json( { message: "Price updated successfully" } );
    } catch ( error ) {
        console.error( "update-price error:", error );
        return res.status( 500 ).json( { error: "Internal Server Error" } );
    }
}
