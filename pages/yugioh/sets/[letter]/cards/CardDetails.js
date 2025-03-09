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
  const { card, letter, setName } = router.query;

  // ✅ Fetch card data
  const { data: cardData, error: cardError } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent( card ) }` : null,
    fetcher
  );

  // ✅ Fetch price history
  const { data: priceHistoryData } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent( card ) }/price-history` : null,
    fetcher
  );

  const [ hasStoredPrice, setHasStoredPrice ] = useState( false );

  useEffect( () => {
    const storePrice = async () => {
      if ( !cardData || !cardData.card_prices || hasStoredPrice ) return;

      try {
        const response = await fetch( `/api/Yugioh/card/${ encodeURIComponent( card ) }/update-price`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify( { price: cardData.card_prices.tcgplayer_price } ),
        } );

        const result = await response.json();
        if ( result.message === "Price recently updated, skipping." ) {
          console.log( "⏳ Price update skipped." );
        } else {
          console.log( "✅ Price updated." );
          mutate( `/api/Yugioh/card/${ encodeURIComponent( card ) }/price-history` );
        }

        setHasStoredPrice( true );
      } catch ( error ) {
        console.error( "Failed to store price:", error );
      }
    };

    storePrice();
  }, [ cardData, card ] );

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
                <p><span className="font-bold">Rarity:</span> { set.set_rarity }</p>
                <p><span className="font-bold">Edition:</span> { set.set_edition }</p>
                <p className="border-b-2 border-b-white divide-y-2 w-[80%] pb-2"><span className="font-bold mb-2.5">Price:</span> ${ set.set_price }</p>
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
