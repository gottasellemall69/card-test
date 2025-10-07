"use client";
import { useEffect, useState, useMemo } from "react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import PriceHistoryChart from "@/components/Yugioh/PriceHistoryChart";

const fetcher = async ( url ) => {
  const response = await fetch( url );
  if ( !response.ok ) {
    const message = await response.text();
    throw new Error( message || "Request failed" );
  }
  return response.json();
};

const CardDetails = () => {
  const router = useRouter();
  const {
    card,
    letter: queryLetter,
    set_name: querySetName,
    set_code: querySetCode,
    rarity: queryRarity,
    edition: queryEdition,
    source,
    card_name: queryCardName,
  } = router.query;

  const letter = Array.isArray( queryLetter ) ? queryLetter[ 0 ] : queryLetter;
  const set_name = Array.isArray( querySetName ) ? querySetName[ 0 ] : querySetName;
  const set_code = Array.isArray( querySetCode ) ? querySetCode[ 0 ] : querySetCode;
  const rarity = Array.isArray( queryRarity ) ? queryRarity[ 0 ] : queryRarity;
  const edition = Array.isArray( queryEdition ) ? queryEdition[ 0 ] : queryEdition;
  const cardName = Array.isArray( queryCardName ) ? queryCardName[ 0 ] : queryCardName;

  const cardId = card?.toString();
  const [ selectedVersion, setSelectedVersion ] = useState( undefined );

  const { data: cardData, error: cardError } = useSWR(
    cardId ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }` : null,
    fetcher
  );

  const shouldLookupByName = ( !cardId || cardError ) && cardName;
  const { data: cardLookupData, error: cardLookupError } = useSWR(
    shouldLookupByName ? `/api/Yugioh/card/lookup?name=${ encodeURIComponent( cardName ) }` : null,
    fetcher
  );

  const resolvedCardData = cardData || cardLookupData;
  const resolvedCardError = resolvedCardData ? null : ( cardLookupError || cardError );
  const effectiveCardId = ( cardId || resolvedCardData?.id )
    ? ( cardId || resolvedCardData?.id ).toString()
    : undefined;

  useEffect( () => {
    if ( !cardData?.card_sets?.length ) {
      return;
    }

    const normalizeEdition = ( value ) => value || "Unknown Edition";
    const buildVersion = ( set ) =>
      `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ normalizeEdition( set.set_edition ) }`;
    const storageKey = effectiveCardId ? `selectedVersion-${ effectiveCardId }` : null;

    const commitSelection = ( version ) => {
      setSelectedVersion( ( current ) => ( current === version ? current : version ) );
      if ( storageKey ) {
        localStorage.setItem( storageKey, version );
      }
    };

    const cardSets = cardData.card_sets;
    const normalizedQueryEdition = normalizeEdition( edition );

    if ( set_name && set_code && rarity && edition ) {
      const exactMatch = cardSets.find(
        ( set ) =>
          set.set_name === set_name &&
          set.set_code === set_code &&
          set.set_rarity === rarity &&
          normalizeEdition( set.set_edition ) === normalizedQueryEdition
      );

      if ( exactMatch ) {
        commitSelection( buildVersion( exactMatch ) );
        return;
      }
    }

    if ( storageKey ) {
      const savedVersion = localStorage.getItem( storageKey );
      if ( savedVersion ) {
        const savedMatch = cardSets.find( ( set ) => buildVersion( set ) === savedVersion );
        if ( savedMatch ) {
          commitSelection( savedVersion );
          return;
        }
      }
    }

    if ( set_name ) {
      const matchBySetName = cardSets.find( ( set ) => set.set_name === set_name );
      if ( matchBySetName ) {
        commitSelection( buildVersion( matchBySetName ) );
        return;
      }
    }

    commitSelection( buildVersion( cardSets[ 0 ] ) );
  }, [ cardData, effectiveCardId, set_name, set_code, rarity, edition ] ); const handleVersionChange = ( e ) => {
    const newVersion = e.target.value;
    setSelectedVersion( newVersion );

    const [ newSetName, newSetCode, newRarity, newEdition ] = newVersion.split( " - " );
    const newLetter = newSetName.charAt( 0 ).toUpperCase();

    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          set_name: newSetName,
          set_code: newSetCode,
          rarity: newRarity,
          edition: newEdition,
          letter: newLetter,
          source: "set",
        },
      },
      undefined,
      { shallow: true }
    );
  };

  const { data: priceHistoryData } = useSWR(
    cardId && selectedVersion
      ? `/api/Yugioh/card/${ encodeURIComponent(
        cardId
      ) }/price-history?set=${ encodeURIComponent(
        selectedVersion.split( " - " )[ 0 ]
      ) }&number=${ encodeURIComponent(
        selectedVersion.split( " - " )[ 1 ]
      ) }&rarity=${ encodeURIComponent(
        selectedVersion.split( " - " )[ 2 ]
      ) }&edition=${ encodeURIComponent(
        selectedVersion.split( " - " )[ 3 ]
      ) }`
      : null,
    fetcher
  );

  useMemo( () => {
    if ( cardId && selectedVersion ) {
      mutate(
        `/api/Yugioh/card/${ encodeURIComponent(
          cardId
        ) }/price-history?set=${ encodeURIComponent(
          selectedVersion.split( " - " )[ 0 ]
        ) }&number=${ encodeURIComponent(
          selectedVersion.split( " - " )[ 1 ]
        ) }&rarity=${ encodeURIComponent(
          selectedVersion.split( " - " )[ 2 ]
        ) }&edition=${ encodeURIComponent( selectedVersion.split( " - " )[ 3 ] ) }`
      );
    }
  }, [ selectedVersion, cardId ] );

  if ( cardError ) return <div>Error loading card data.</div>;
  if ( !cardData ) return <div className="mx-auto min-h-screen bg-fixed bg-cover yugioh-bg">Loading card data...</div>;

  return (
    <>
      <div className="mx-auto min-h-screen bg-fixed bg-cover yugioh-bg">
        {/* 🔹 Breadcrumb shows Sets → SetName → Card Name */ }
        <Breadcrumb
          items={ [
            { label: "Sets", href: "/yugioh/sets/set-index" },
            set_name
              ? { label: set_name, href: `/yugioh/sets/${ letter }/${ set_name }` }
              : null,
            { label: cardData?.name || "Card Details", href: router.asPath },
          ].filter( Boolean ) }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 w-full mx-auto">
          <div className="glass h-8/12 p-6 text-white rounded-md shadow-md text-shadow">
            <h1 className="text-2xl font-extrabold mb-4">{ cardData.name }</h1>
            <p className="mb-1">
              <span className="font-bold">Card Type:</span> { cardData.type }
            </p>
            <p className="mb-1">
              <span className="font-bold">Description:</span> { cardData.desc }
            </p>
            <p className="mb-1">
              <span className="font-bold">Monster Type:</span> { cardData.race }
            </p>
            <p className="mb-1">
              <span className="font-bold">Archetype:</span> { cardData.archetype }
            </p>

            <div className="mt-6">
              <label className="block text-sm font-bold mb-2">Select Version:</label>
              <select
                className="text-black p-2 rounded-md w-full"
                value={ selectedVersion }
                onChange={ handleVersionChange }
              >
                { cardData.card_sets?.map( ( set, idx ) => (
                  <option
                    key={ idx }
                    value={ `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition"
                      }` }
                  >
                    { set.set_name } - { set.set_code } - { set.set_rarity } -{ " " }
                    { set.set_edition || "Unknown Edition" }
                  </option>
                ) ) }
              </select>
            </div>

            <p className="mt-4 border-t pt-4">
              <span className="font-bold">Market Price:</span> $
              { cardData.card_sets?.find(
                ( set ) =>
                  `${ set.set_name } - ${ set.set_code } - ${ set.set_rarity } - ${ set.set_edition || "Unknown Edition"
                  }` === selectedVersion
              )?.set_price || "N/A" }
            </p>
          </div>

          <div className="glass p-6 rounded-md shadow-md">
            <h2 className="text-2xl font-bold mb-1 text-white text-shadow">
              Price History
            </h2>
            <PriceHistoryChart
              priceHistory={ priceHistoryData?.priceHistory || [] }
              selectedVersion={ selectedVersion }
              source={ "set" }
            />
          </div>
        </div>
      </div>
      <SpeedInsights />
    </>
  );
};

export default CardDetails;

