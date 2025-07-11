"use client";
import { useEffect, useState, useMemo } from "react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import PriceHistoryChart from "@/components/Yugioh/PriceHistoryChart";

const fetcher = ( url ) => fetch( url ).then( ( res ) => res.json() );

const CardDetails = () => {
  const router = useRouter();
  const {
    card,
    letter: queryLetter,
    set_name: querySetName,
    set_code: querySetCode,
    rarity: queryRarity,
    edition: queryEdition,
  } = router.query;

  const letter = Array.isArray( queryLetter ) ? queryLetter[ 0 ] : queryLetter;
  const set_name = Array.isArray( querySetName ) ? querySetName[ 0 ] : querySetName;
  const set_code = Array.isArray( querySetCode ) ? querySetCode[ 0 ] : querySetCode;
  const rarity = Array.isArray( queryRarity ) ? queryRarity[ 0 ] : queryRarity;
  const edition = Array.isArray( queryEdition ) ? queryEdition[ 0 ] : queryEdition;

  const cardId = card?.toString();
  const [ selectedVersion, setSelectedVersion ] = useState( "" );

  const { data: cardData, error: cardError } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }` : null,
    fetcher
  );

  useMemo( () => {
    if ( cardData?.card_sets ) {
      const savedVersion = localStorage.getItem( `selectedVersion-${ cardId }` );

      const queryVersion = `${ set_name } - ${ set_code } - ${ rarity } - ${ edition || "Unknown Edition" }`;
      const hasQueryVersion = cardData.card_sets.some(
        ( set ) =>
          `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` === queryVersion
      );

      if ( hasQueryVersion ) {
        setSelectedVersion( queryVersion );
      } else if (
        savedVersion &&
        cardData.card_sets.some(
          ( set ) =>
            `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` === savedVersion
        )
      ) {
        setSelectedVersion( savedVersion );
      } else {
        const defaultVersion = `${ cardData.card_sets[ 0 ].set_name } - ${ cardData.card_sets[ 0 ].set_code } - ${ cardData.card_sets[ 0 ].set_rarity } - ${ cardData.card_sets[ 0 ].set_edition || "Unknown Edition" }`;
        setSelectedVersion( defaultVersion );
      }
    }
  }, [ cardData, cardId, set_name, set_code, rarity, edition ] );

  const handleVersionChange = ( e ) => {
    const newVersion = e.target.value;
    setSelectedVersion( newVersion );

    const [ newSetName, newSetCode, newRarity, newEdition ] = newVersion.split( " - " );
    const newLetter = newSetName.charAt( 0 ).toUpperCase();

    router.replace( {
      pathname: router.pathname,
      query: {
        ...router.query,
        set_name: newSetName,
        set_code: newSetCode,
        rarity: newRarity,
        edition: newEdition,
        letter: newLetter,
        source: cardData.source

      },
    }, undefined, { shallow: true } );
  };


  const { data: priceHistoryData } = useSWR(
    cardId && selectedVersion ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }/price-history?set=${ encodeURIComponent( selectedVersion.split( " - " )[ 0 ] ) }&number=${ encodeURIComponent( selectedVersion.split( " - " )[ 1 ] ) }&rarity=${ encodeURIComponent( selectedVersion.split( " - " )[ 2 ] ) }&edition=${ encodeURIComponent( selectedVersion.split( " - " )[ 3 ] ) }` : null,
    fetcher
  );

  useMemo( () => {
    if ( cardId && selectedVersion ) {
      mutate(
        `/api/Yugioh/card/${ encodeURIComponent( cardId ) }/price-history?set=${ encodeURIComponent( selectedVersion.split( " - " )[ 0 ] ) }&number=${ encodeURIComponent( selectedVersion.split( " - " )[ 1 ] ) }&rarity=${ encodeURIComponent( selectedVersion.split( " - " )[ 2 ] ) }&edition=${ encodeURIComponent( selectedVersion.split( " - " )[ 3 ] ) }`
      );
    }
  }, [ selectedVersion, cardId ] );

  if ( cardError ) return <div>Error loading card data.</div>;
  if ( !cardData ) return <div>Loading card data...</div>;

  return (
    <>
      <Breadcrumb />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="glass p-6 text-white rounded-md shadow-md text-shadow">
          <h1 className="text-2xl font-extrabold mb-4">{ cardData.name }</h1>
          <p className="mb-1"><span className="font-bold">Card Type:</span> { cardData.type }</p>
          <p className="mb-1"><span className="font-bold">Description:</span> { cardData.desc }</p>
          <p className="mb-1"><span className="font-bold">Monster Type:</span> { cardData.race }</p>
          <p className="mb-1"><span className="font-bold">Archetype:</span> { cardData.archetype }</p>

          <div className="mt-6">
            <label className="block text-sm font-bold mb-2">Select Version:</label>
            <select
              className="text-black p-2 rounded-md w-full"
              value={ selectedVersion }
              onChange={ handleVersionChange }
            >
              { cardData.card_sets?.map( ( set, index ) => (
                <option
                  key={ index }
                  value={ `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` }
                >
                  { set.set_name } - { set.set_code } - { set.set_rarity } - { set.set_edition || "Unknown Edition" }
                </option>
              ) ) }
            </select>
          </div>

          <p className="mt-4 border-t pt-4">
            <span className="font-bold">Market Price:</span> $
            { cardData.card_sets?.find(
              ( set ) =>
                `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition" }` === selectedVersion )?.set_price || "N/A" }
          </p>
        </div>

        <div className="glass p-6 rounded-md shadow-md">
          <h2 className="text-lg font-bold mb-4 text-white">Price History</h2>
          <PriceHistoryChart
            priceHistory={ priceHistoryData?.priceHistory || [] }
            selectedVersion={ selectedVersion }
          />
        </div>
      </div>

      <SpeedInsights />
    </>
  );
};

export default CardDetails;
