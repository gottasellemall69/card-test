"use client";
import { useCallback, useEffect, useState, useMemo } from "react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";
import PriceHistoryChart from "@/components/Yugioh/PriceHistoryChart";
import Notification from "@/components/Notification";
import { readAuthStateFromCookie, subscribeToAuthState, dispatchAuthStateChange } from "@/utils/authState";

const fetcher = async ( url ) => {
  const response = await fetch( url );
  if ( !response.ok ) {
    const message = await response.text();
    throw new Error( message || "Request failed" );
  }
  return response.json();
};

const VERSION_SEPARATOR = " - ";
const LOCAL_IMAGE_BASE_PATH = "/images/yugiohImages";
const FALLBACK_IMAGE = "/images/yugioh-card.png";
const DEFAULT_CONDITION = "Near Mint";

const normalizeEditionLabel = ( value ) => value || "Unknown Edition";
const buildConditionLabel = ( printingLabel ) => {
  const trimmedPrinting = ( printingLabel ?? "" ).toString().trim();
  if ( !trimmedPrinting ) {
    return DEFAULT_CONDITION;
  }
  return `${ DEFAULT_CONDITION } ${ trimmedPrinting }`;
};
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

const buildImagePath = ( cardId ) => `${ LOCAL_IMAGE_BASE_PATH }/${ String( cardId ) }.jpg`;

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
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ isAddingToCollection, setIsAddingToCollection ] = useState( false );
  const [ notification, setNotification ] = useState( { show: false, message: "" } );

  const { data: cardData, error: cardError } = useSWR(
    cardId ? `/api/Yugioh/card/${ encodeURIComponent( cardId ) }` : null,
    fetcher
  );

  const triggerNotification = useCallback( ( message ) => {
    if ( !message ) return;
    setNotification( { show: true, message } );
  }, [] );

  const updateNotificationVisibility = useCallback( ( showValue ) => {
    setNotification( ( prev ) => ( { ...prev, show: showValue } ) );
  }, [] );

  useEffect( () => {
    const syncAuthState = () => {
      setIsAuthenticated( readAuthStateFromCookie() );
    };

    syncAuthState();
    const unsubscribe = subscribeToAuthState( ( state ) => setIsAuthenticated( Boolean( state ) ) );
    window.addEventListener( "focus", syncAuthState );

    return () => {
      unsubscribe();
      window.removeEventListener( "focus", syncAuthState );
    };
  }, [] );

  const shouldLookupByName = ( !cardId || cardError ) && cardName;
  const { data: cardLookupData, error: cardLookupError } = useSWR(
    shouldLookupByName ? `/api/Yugioh/card/lookup?name=${ encodeURIComponent( cardName ) }` : null,
    fetcher
  );

  const shouldLookupBySet = ( !cardId || cardError || cardLookupError ) && set_name && set_code;
  const setLookupParams = shouldLookupBySet
    ? new URLSearchParams( {
      set_name,
      set_code,
      ...( cardName ? { card_name: cardName } : {} ),
    } )
    : null;
  const { data: cardSetLookupData, error: cardSetLookupError } = useSWR(
    setLookupParams ? `/api/Yugioh/card/lookup-by-set?${ setLookupParams.toString() }` : null,
    fetcher
  );

  const resolvedCardData = cardData || cardLookupData || cardSetLookupData;
  const resolvedCardError = resolvedCardData
    ? null
    : ( cardSetLookupError || cardLookupError || cardError );
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

  const localImageSrc = activeCardId ? buildImagePath( activeCardId ) : null;
  const remoteImageSrc = resolvedCardData?.card_images?.[ 0 ]?.image_url || null;
  const primaryImageSrc = localImageSrc || remoteImageSrc || FALLBACK_IMAGE;
  const secondaryImageSrc = primaryImageSrc === localImageSrc ? remoteImageSrc : localImageSrc;

  const handleImageError = ( event ) => {
    const img = event.currentTarget;
    const nextSrc = img.dataset.nextSrc;
    const fallbackSrc = img.dataset.fallbackSrc;

    if ( nextSrc ) {
      img.src = nextSrc;
      img.dataset.nextSrc = "";
      return;
    }

    if ( fallbackSrc ) {
      img.src = fallbackSrc;
      img.dataset.fallbackSrc = "";
      img.onerror = null;
    }
  };

  const handleAddToCollection = useCallback( async () => {
    if ( !resolvedCardData || !selectedSetDetails ) {
      triggerNotification( "Select a card version before adding to your collection." );
      return;
    }

    if ( !isAuthenticated ) {
      triggerNotification( "Log in to add cards to your collection." );
      return;
    }

    if ( isAddingToCollection ) {
      return;
    }

    const printingLabel = normalizeEditionLabel( selectedSetDetails.set_edition );
    const conditionLabel = buildConditionLabel( printingLabel );
    const cardPayload = {
      productName: resolvedCardData.name,
      setName: selectedSetDetails.set_name || set_name || "",
      number: selectedSetDetails.set_code || set_code || "",
      printing: printingLabel,
      rarity: selectedSetDetails.set_rarity || resolvedRarityParam || "",
      condition: conditionLabel,
      marketPrice: parseFloat( selectedSetDetails.set_price ) || 0,
      lowPrice: 0,
      quantity: 1,
      cardId: activeCardId || null,
      remoteImageUrl: remoteImageSrc || null,
    };

    setIsAddingToCollection( true );

    try {
      const response = await fetch( "/api/Yugioh/cards", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify( { cards: [ cardPayload ] } ),
      } );

      if ( response.status === 401 ) {
        setIsAuthenticated( false );
        dispatchAuthStateChange( false );
        triggerNotification( "Log in to add cards to your collection." );
        return;
      }

      if ( !response.ok ) {
        throw new Error( "Failed to add card" );
      }

      triggerNotification( "Card added to the collection!" );
    } catch ( error ) {
      console.error( "Error adding card to collection:", error );
      triggerNotification( "Failed to add card to the collection." );
    } finally {
      setIsAddingToCollection( false );
    }
  }, [
    activeCardId,
    isAddingToCollection,
    isAuthenticated,
    remoteImageSrc,
    resolvedCardData,
    resolvedRarityParam,
    selectedSetDetails,
    set_code,
    set_name,
    triggerNotification,
  ] );

  if ( resolvedCardError ) return <div>Error loading card data.</div>;
  if ( !resolvedCardData ) return <div className="mx-auto min-h-screen bg-fixed bg-cover yugioh-bg">Loading card data...</div>;

  return (
    <>

      <div className="mx-auto min-h-screen bg-fixed bg-cover p-2 yugioh-bg">
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
          <div className="glass h-8/12 p-6 text-white rounded-md text-shadow">
            <h1 className="text-2xl font-extrabold mb-4">{ resolvedCardData.name }</h1>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
              <div className="flex justify-center lg:justify-start lg:w-5/12">
                <div className="flex w-full flex-col items-center gap-3">
                  <img
                    src={ primaryImageSrc }
                    data-next-src={ secondaryImageSrc || "" }
                    data-fallback-src={ FALLBACK_IMAGE }
                    alt={ `${ resolvedCardData.name } card image` }
                    className="object-scale-down object-center w-full h-96 rounded-md"
                    loading="lazy"
                    decoding="async"
                    onError={ handleImageError }
                  />
                  <button
                    type="button"
                    onClick={ handleAddToCollection }
                    disabled={ isAddingToCollection || !selectedSetDetails }
                    className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    { isAddingToCollection ? "Adding..." : "Add to Collection" }
                  </button>
                </div>
              </div>
              <div className="flex-1">
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
            </div>
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
      <Notification
        show={ notification.show }
        setShow={ updateNotificationVisibility }
        message={ notification.message }
      />
      <SpeedInsights />
    </>
  );
};

export default CardDetails;
