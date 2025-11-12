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

const VERSION_SEPARATOR = " - ";

const normalizeEditionLabel = ( value ) => value || "Unknown Edition";
const serializeVersion = ( set ) =>
  [
    set.set_name,
    set.set_code,
    set.set_rarity,
    normalizeEditionLabel( set.set_edition ),
  ].join( VERSION_SEPARATOR );

const parseVersion = ( versionString ) => {
  if ( !versionString ) return null;
  const [ setName = "", setCode = "", rarity = "", edition = "" ] = versionString.split( VERSION_SEPARATOR );
  return {
    setName,
    setCode,
    rarity,
    edition,
  };
};

const buildPriceHistoryKey = ( cardId, versionTokens ) => {
  if ( !cardId || !versionTokens?.setName ) return null;
  const searchParams = new URLSearchParams( {
    set: versionTokens.setName,
    number: versionTokens.setCode,
    rarity: versionTokens.rarity,
    edition: versionTokens.edition,
  } );
  return `/api/Yugioh/card/${ encodeURIComponent( cardId ) }/price-history?${ searchParams.toString() }`;
};

const CardDetails = () => {
  const router = useRouter();
  const {
    card,
    letter: queryLetter,
    set_name: querySetName,
    set_code: querySetCode,
    set_rarity: queryRarity,
    rarity: queryLegacyRarity,
    edition: queryEdition,
    source,
    card_name: queryCardName,
  } = router.query;

  const letter = Array.isArray( queryLetter ) ? queryLetter[ 0 ] : queryLetter;
  const set_name = Array.isArray( querySetName ) ? querySetName[ 0 ] : querySetName;
  const set_code = Array.isArray( querySetCode ) ? querySetCode[ 0 ] : querySetCode;
  const setRarityParam = Array.isArray( queryRarity ) ? queryRarity[ 0 ] : queryRarity;
  const legacyRarityParam = Array.isArray( queryLegacyRarity ) ? queryLegacyRarity[ 0 ] : queryLegacyRarity;
  const resolvedRarityParam = setRarityParam ?? legacyRarityParam ?? null;
  const edition = Array.isArray( queryEdition ) ? queryEdition[ 0 ] : queryEdition;
  const cardName = Array.isArray( queryCardName ) ? queryCardName[ 0 ] : queryCardName;

  const cardId = Array.isArray( card ) ? card[ 0 ]?.toString() : card?.toString();
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
    if ( !resolvedCardData?.card_sets?.length ) {
      return;
    }

    const storageKey = effectiveCardId ? `selectedVersion-${ effectiveCardId }` : null;

    const commitSelection = ( version ) => {
      setSelectedVersion( ( current ) => ( current === version ? current : version ) );
      if ( storageKey ) {
        localStorage.setItem( storageKey, version );
      }
    };

    const canonicalize = ( value, { allowUnknown = false } = {} ) => {
      if ( value === null || value === undefined ) {
        return allowUnknown ? "unknown edition" : null;
      }
      const trimmed = value.toString().trim();
      if ( !trimmed ) {
        return allowUnknown ? "unknown edition" : null;
      }
      return trimmed.toLowerCase();
    };

    const canonicalizeLoose = ( value, options ) => {
      const canonical = canonicalize( value, options );
      if ( canonical === null ) return null;
      return canonical.replace( /[^a-z0-9]+/g, "" );
    };

    const queryTokens = {
      setName: canonicalize( set_name ),
      setNameLoose: canonicalizeLoose( set_name ),
      setCode: canonicalize( set_code ),
      setCodeLoose: canonicalizeLoose( set_code ),
      rarity: canonicalize( resolvedRarityParam ),
      rarityLoose: canonicalizeLoose( resolvedRarityParam ),
      edition: canonicalize( edition, { allowUnknown: true } ),
      editionLoose: canonicalizeLoose( edition, { allowUnknown: true } ),
    };

    const hasQueryPreferences =
      queryTokens.setName || queryTokens.setCode || queryTokens.rarity || queryTokens.edition;

    const cardSets = resolvedCardData.card_sets;

    const evaluateCandidate = ( set ) => {
      const tokens = {
        setName: canonicalize( set.set_name ),
        setNameLoose: canonicalizeLoose( set.set_name ),
        setCode: canonicalize( set.set_code ),
        setCodeLoose: canonicalizeLoose( set.set_code ),
        rarity: canonicalize( set.set_rarity ),
        rarityLoose: canonicalizeLoose( set.set_rarity ),
        edition: canonicalize( set.set_edition, { allowUnknown: true } ),
        editionLoose: canonicalizeLoose( set.set_edition, { allowUnknown: true } ),
      };

      const matchesSetName =
        !queryTokens.setName ||
        tokens.setName === queryTokens.setName ||
        ( queryTokens.setNameLoose && tokens.setNameLoose === queryTokens.setNameLoose );

      if ( !matchesSetName ) {
        return { score: Number.NEGATIVE_INFINITY, set };
      }

      let score = 0;

      if ( queryTokens.setCode ) {
        if ( tokens.setCode === queryTokens.setCode ) {
          score += 40;
        } else if ( queryTokens.setCodeLoose && tokens.setCodeLoose === queryTokens.setCodeLoose ) {
          score += 25;
        } else {
          score -= 10;
        }
      }

      if ( queryTokens.rarity ) {
        if ( tokens.rarity === queryTokens.rarity ) {
          score += 30;
        } else if ( queryTokens.rarityLoose && tokens.rarityLoose === queryTokens.rarityLoose ) {
          score += 20;
        } else {
          score -= 5;
        }
      }

      if ( queryTokens.edition ) {
        if ( tokens.edition === queryTokens.edition ) {
          score += 10;
        } else if ( queryTokens.editionLoose && tokens.editionLoose === queryTokens.editionLoose ) {
          score += 7;
        } else if (
          queryTokens.edition.includes( "unknown" ) &&
          ( tokens.edition?.includes( "unknown" ) || tokens.editionLoose === queryTokens.editionLoose )
        ) {
          score += 5;
        } else {
          score -= 1;
        }
      }

      return { score, set };
    };

    if ( hasQueryPreferences ) {
      let bestCandidate = { score: Number.NEGATIVE_INFINITY, set: null };

      for ( const set of cardSets ) {
        const evaluated = evaluateCandidate( set );
        if ( evaluated.score > bestCandidate.score ) {
          bestCandidate = evaluated;
        }
      }

      if ( bestCandidate.set ) {
        commitSelection( serializeVersion( bestCandidate.set ) );
        return;
      }
    }

    if ( storageKey ) {
      const savedVersion = localStorage.getItem( storageKey );
      if ( savedVersion ) {
        const savedMatch = cardSets.find( ( set ) => serializeVersion( set ) === savedVersion );
        if ( savedMatch ) {
          commitSelection( savedVersion );
          return;
        }
      }
    }

    if ( queryTokens.setName ) {
      const matchBySetName = cardSets.find( ( set ) => {
        const canonical = canonicalize( set.set_name );
        const loose = canonicalizeLoose( set.set_name );
        return (
          canonical === queryTokens.setName || ( queryTokens.setNameLoose && loose === queryTokens.setNameLoose )
        );
      } );
      if ( matchBySetName ) {
        commitSelection( serializeVersion( matchBySetName ) );
        return;
      }
    }

    commitSelection( serializeVersion( cardSets[ 0 ] ) );
  }, [ resolvedCardData, effectiveCardId, set_name, set_code, resolvedRarityParam, edition ] );

  const handleVersionChange = ( e ) => {
    const newVersion = e.target.value;
    setSelectedVersion( newVersion );

    const versionTokens = parseVersion( newVersion );
    if ( !versionTokens ) return;
    const { setName: newSetName, setCode: newSetCode, rarity: newRarity, edition: newEdition } = versionTokens;
    const newLetter = newSetName.charAt( 0 ).toUpperCase();

    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          set_name: newSetName,
          set_code: newSetCode,
          set_rarity: newRarity,
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

  const activeCardId = effectiveCardId || cardLookupData?.id || cardData?.id;
  const selectedVersionTokens = useMemo( () => parseVersion( selectedVersion ), [ selectedVersion ] );
  const priceHistoryKey = buildPriceHistoryKey( activeCardId, selectedVersionTokens );

  const { data: priceHistoryData } = useSWR( priceHistoryKey, fetcher );

  useEffect( () => {
    if ( priceHistoryKey ) {
      mutate( priceHistoryKey );
    }
  }, [ priceHistoryKey ] );

  const selectedSetDetails = useMemo( () => {
    if ( !selectedVersion || !resolvedCardData?.card_sets?.length ) return null;
    return resolvedCardData.card_sets.find( ( set ) => serializeVersion( set ) === selectedVersion );
  }, [ resolvedCardData, selectedVersion ] );

  if ( resolvedCardError ) return <div>Error loading card data.</div>;
  if ( !resolvedCardData ) return <div className="mx-auto min-h-screen bg-fixed bg-cover yugioh-bg">Loading card data...</div>;

  return (
    <>

      <div className="mx-auto min-h-screen bg-fixed bg-cover yugioh-bg p-3">
        {/* 🔹 Breadcrumb shows Sets → SetName → Card Name */ }
        <Breadcrumb
          items={ [
            { label: "Sets", href: "/yugioh/sets/set-index" },
            set_name
              ? { label: set_name, href: `/yugioh/sets/${ letter }/${ set_name }` }
              : null,
            { label: resolvedCardData?.name || "Card Details", href: router.asPath },
          ].filter( Boolean ) }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 w-full mx-auto">
          <div className="glass h-8/12 p-6 text-white rounded-md shadow-md text-shadow">
            <h1 className="text-2xl font-extrabold mb-4">{ resolvedCardData.name }</h1>
            <p className="mb-1">
              <span className="font-bold">Card Type:</span> { resolvedCardData.type }
            </p>
            <p className="mb-1">
              <span className="font-bold">Description:</span> { resolvedCardData.desc }
            </p>
            <p className="mb-1">
              <span className="font-bold">Monster Type:</span> { resolvedCardData.race }
            </p>
            <p className="mb-1">
              <span className="font-bold">Archetype:</span> { resolvedCardData.archetype }
            </p>

            <div className="mt-6">
              <label className="block text-sm font-bold mb-2">Select Version:</label>
              <select
                className="text-black p-2 rounded-md w-full"
                value={ selectedVersion }
                onChange={ handleVersionChange }
              >
                { resolvedCardData.card_sets?.map( ( set, idx ) => (
                  <option
                    key={ `${ set.set_code }-${ set.set_rarity }-${ idx }` }
                    value={ serializeVersion( set ) }
                  >
                    { set.set_name } - { set.set_code } - { set.set_rarity } - { normalizeEditionLabel( set.set_edition ) }
                  </option>
                ) ) }
              </select>
            </div>

            <p className="mt-4 border-t pt-4">
              <span className="font-bold">Market Price:</span> $
              { selectedSetDetails?.set_price || "N/A" }
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

