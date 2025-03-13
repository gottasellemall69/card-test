"use client";
import { useEffect, useState } from "react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import PriceHistoryChart from "@/components/Yugioh/PriceHistoryChart";

const fetcher = ( url ) => fetch( url ).then( ( res ) => res.json() );

const CardDetails = () => {
  const router = useRouter();
  const { card, name, letter, setName } = router.query;
  const cardId = card?.toString();

  // ✅ Fetch card data
  const { data: cardData, error: cardError } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }` : null,
    fetcher
  );

  // ✅ Fetch price history
  const { data: priceHistoryData } = useSWR(
    cardId ? `/api/Yugioh/card/${ cardId }/price-history` : null,
    fetcher
  );

  const [ hasStoredPrice, setHasStoredPrice ] = useState( false );

  useEffect( () => {
    const storePrice = async () => {
      console.log( "🔍 cardData before sending request:", cardData );

      if ( !cardData || !cardData.id ) {
        console.error( "❌ cardData is missing or undefined!" );
        return;
      }

      // Extract correct set details from first available set
      const firstSet = cardData?.card_sets?.[ 0 ] || {};
      const price = parseFloat( cardData?.card_prices?.[ 0 ]?.tcgplayer_price || 0 );

      // Check if the price is valid
      if ( isNaN( price ) || price === 0 ) {
        console.error( "❌ Invalid price, skipping update:", price );
        return;
      }

      const priceUpdatePayload = {
        cardId: cardData.id,
        newPrice: price,
      };

      console.log( "📤 Sending price update payload:", priceUpdatePayload );

      try {
        const response = await fetch( `/api/Yugioh/card/${ cardId }/update-price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify( priceUpdatePayload ),
        } );

        const data = await response.json();

        if ( response.ok ) {
          console.log( "✅ Price updated." );
          setHasStoredPrice( true );
        } else {
          console.error( "❌ Failed to update price:", data.error );
        }
      } catch ( error ) {
        console.error( "❌ Error updating price:", error );
      }
    };

    if ( !hasStoredPrice && cardData ) {
      storePrice();
    }
  }, [ cardData, hasStoredPrice ] );

  if ( cardError ) return <div>Error loading card data.</div>;
  if ( !cardData ) return <div>Loading card data...</div>;

  return (
    <>
      <Breadcrumb>
        <Link href="/yugioh">Alphabetical Index</Link>
        <Link href={ `/yugioh/${ letter }/sets` }>Sets by Letter: { letter }</Link>
        <Link href={ `/yugioh/sets/${ letter }/cards/${ setName }` }>Cards in Set: { setName }</Link>
        <div><p><span className="text-black">Card Details: { cardData.name }</span></p></div>
      </Breadcrumb>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="p-6 text-white rounded-md shadow-md glass text-shadow">
          <h1 className="text-2xl font-bold mb-4">{ cardData.name }</h1>
          <p><span className="font-bold">Type:</span> { cardData.type }</p>
          <p><span className="font-bold">Description:</span> { cardData.desc }</p>
          <p><span className="font-bold">Race:</span> { cardData.race }</p>
          <p><span className="font-bold">Archetype:</span> { cardData.archetype }</p>
          <h2 className="text-lg font-bold mt-4">Set Details</h2>
          <ul className='text-nowrap inline-flex flex-wrap flex-col sm:flex-row gap-5'>
            { cardData.card_sets?.map( ( set, index ) => (
              <li key={ index }>
                <p><span className="font-bold">Set:</span> { set.set_name }</p>
                <p><span className="font-bold">Number:</span> { set.set_code }</p>
                <p className="border-b-2 border-b-white divide-y-2 w-[80%] pb-2">
                  <span className="font-bold mb-2.5">Price:</span>
                  { cardData?.card_prices?.[ 0 ]?.tcgplayer_price ? (
                    `$${ cardData.card_prices[ 0 ].tcgplayer_price }`
                  ) : (
                    "N/A"
                  ) }
                </p>
              </li>
            ) ) }
          </ul>
        </div>

        {/* ✅ Price History Chart Panel */ }
        <div className="p-6 glass rounded-md shadow-md">
          <h2 className="text-lg font-bold mb-2 text-white">Price History</h2>
          <PriceHistoryChart priceHistory={ priceHistoryData?.priceHistory || [] } />
        </div>
      </div>

      <SpeedInsights />
    </>
  );
};

export default CardDetails;
