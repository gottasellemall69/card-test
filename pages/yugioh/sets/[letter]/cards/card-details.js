// pages\yugioh\sets\[letter]\cards\card-details.js

"use client";
import { useEffect, useState, useMemo } from "react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from "next/link";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import PriceHistoryChart from "@/components/Yugioh/PriceHistoryChart";

const fetcher = ( url ) => fetch( url ).then( ( res ) => res.json() );

const CardDetails = () => {
  const router = useRouter();
  const { card, name, letter, set_name, rarity, edition } = router.query;
  const cardId = card?.toString();

  // ✅ Ensure query parameters are set correctly
  const decodedSetName = set_name ? encodeURIComponent( set_name ) : "Unknown Set";

  // ✅ Fetch card data
  const { data: cardData, error: cardError } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }` : null,
    fetcher
  );

  // ✅ State for Selected Card Version
  const [ selectedVersion, setSelectedVersion ] = useState( "" );

  useEffect( () => {
    if ( cardData?.card_sets ) {
      const savedVersion = localStorage.getItem( `selectedVersion-${ cardId }` );
      if ( savedVersion && cardData.card_sets.some( set => `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` === savedVersion ) ) {
        setSelectedVersion( savedVersion );
      } else {
        const defaultVersion = `${ cardData.card_sets[ 0 ].set_name } - ${ cardData.card_sets[ 0 ].set_code } - ${ cardData.card_sets[ 0 ].set_rarity } - ${ cardData.card_sets[ 0 ].set_edition || "Unknown Edition" }`;
        setSelectedVersion( defaultVersion );
      }
    }
  }, [ cardData, cardId ] );

  // ✅ Handle version selection change
  const handleVersionChange = ( e ) => {
    const newVersion = e.target.value;
    setSelectedVersion( newVersion );
  };

  const { data: priceHistoryData } = useSWR( cardId && selectedVersion ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }/price-history?set=${ encodeURIComponent( selectedVersion.split( " - " )[ 0 ] ) }&number=${ encodeURIComponent( selectedVersion.split( " - " )[ 1 ] ) }&rarity=${ encodeURIComponent( selectedVersion.split( " - " )[ 2 ] ) }&edition=${ encodeURIComponent( selectedVersion.split( " - " )[ 3 ] ) }` : null, fetcher );

  useMemo( () => {
    if ( cardId && selectedVersion ) {
      mutate( `/api/Yugioh/card/${ encodeURIComponent( cardId ) }/price-history?set=${ encodeURIComponent( selectedVersion.split( " - " )[ 0 ] ) }&number=${ encodeURIComponent( selectedVersion.split( " - " )[ 1 ] ) }&rarity=${ encodeURIComponent( selectedVersion.split( " - " )[ 2 ] ) }&edition=${ encodeURIComponent( selectedVersion.split( " - " )[ 3 ] ) }` );
    }
  },
    [ selectedVersion, cardId ] );
  if ( cardError ) return <div>Error loading card data.</div>;
  if ( !cardData ) return <div>Loading card data...</div>;

  return (
    <>
      <Breadcrumb />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        <div className="p-6 text-white rounded-md shadow-md glass text-shadow">
          <h1 className="text-2xl font-bold mb-4">{ cardData.name }</h1>
          <p><span className="font-bold">Card Type:</span> { cardData.type }</p>
          <p><span className="font-bold">Description:</span> { cardData.desc }</p>
          <p><span className="font-bold">Monster Type:</span> { cardData.race }</p>
          <p><span className="font-bold">Archetype:</span> { cardData.archetype }</p>
          {/* 🔹 Combined Dropdown for Set, Rarity, and Edition */ }
          <h2 className="text-lg font-bold mt-4">Set Details</h2>
          <div className="mb-3">
            <label className="block text-sm font-bold">Select Version:</label>
            <select className="text-black p-2 rounded-md w-full" value={ selectedVersion } onChange={ handleVersionChange }>
              { cardData.card_sets?.map( ( set, index ) => (
                <option key={ index } value={ `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` }>
                  { set.set_name } - { set.set_code } - { set.set_rarity } - { set.set_edition || "Unknown Edition" }
                </option>
              ) ) }
            </select>
          </div>

          <p className="border-b-2 border-b-white divide-y-2 w-[80%] pb-2">
            <span className="font-bold mb-2.5">Price:</span> $
            { cardData.card_sets?.find( set => `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` === selectedVersion )?.set_price || "N/A" }
          </p>
        </div>

        {/* ✅ Price History Chart Panel */ }
        <div className="p-6 glass rounded-md shadow-md">
          <h2 className="text-lg font-bold mb-2 text-white">Price History</h2>
          <PriceHistoryChart priceHistory={ priceHistoryData?.priceHistory || [] } selectedVersion={ selectedVersion } />

        </div>
      </div>

      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default CardDetails;
