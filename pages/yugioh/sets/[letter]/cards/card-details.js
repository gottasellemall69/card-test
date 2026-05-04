"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { useAppShellSlots } from "@/components/Layout";
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

const hasDisplayValue = ( value ) => value !== null && value !== undefined && value !== "";

const formatCurrency = ( value, { allowZero = true } = {} ) => {
  const numeric = Number( value );
  if ( !Number.isFinite( numeric ) ) {
    return "N/A";
  }

  if ( !allowZero && numeric <= 0 ) {
    return "N/A";
  }

  return `$${ numeric.toFixed( 2 ) }`;
};

const formatSignedCurrency = ( value ) => {
  const numeric = Number( value );
  if ( !Number.isFinite( numeric ) ) {
    return "N/A";
  }

  const prefix = numeric > 0 ? "+" : "";
  return `${ prefix }$${ numeric.toFixed( 2 ) }`;
};

const formatStatValue = ( value ) => {
  if ( value === 0 ) {
    return "0";
  }

  if ( !hasDisplayValue( value ) ) {
    return "N/A";
  }

  return value.toString();
};

const formatTitleToken = ( value = "" ) =>
  value
    .toString()
    .replace( /([a-z])([A-Z])/g, "$1 $2" )
    .replace( /[_-]+/g, " " )
    .replace( /\s+/g, " " )
    .trim()
    .replace( /\b\w/g, ( char ) => char.toUpperCase() );

const resolveCardTheme = ( frameType = "", cardType = "" ) => {
  const token = `${ frameType } ${ cardType }`.toLowerCase();

  if ( token.includes( "spell" ) ) {
    return {
      badgeClass: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
      accentValueClass: "text-emerald-300",
      heroGlowClass: "from-emerald-400/25 via-emerald-300/12 to-transparent",
      buttonClass: "border-emerald-300/25 bg-emerald-500/80 hover:bg-emerald-400",
    };
  }

  if ( token.includes( "trap" ) ) {
    return {
      badgeClass: "border-rose-300/30 bg-rose-400/10 text-rose-100",
      accentValueClass: "text-rose-300",
      heroGlowClass: "from-rose-400/25 via-rose-300/12 to-transparent",
      buttonClass: "border-rose-300/25 bg-rose-500/80 hover:bg-rose-400",
    };
  }

  if ( token.includes( "xyz" ) ) {
    return {
      badgeClass: "border-violet-300/30 bg-violet-400/10 text-violet-100",
      accentValueClass: "text-violet-300",
      heroGlowClass: "from-violet-400/25 via-violet-300/12 to-transparent",
      buttonClass: "border-violet-300/25 bg-violet-500/80 hover:bg-violet-400",
    };
  }

  if ( token.includes( "synchro" ) ) {
    return {
      badgeClass: "border-sky-300/30 bg-sky-400/10 text-sky-100",
      accentValueClass: "text-sky-300",
      heroGlowClass: "from-sky-300/28 via-white/10 to-transparent",
      buttonClass: "border-sky-300/25 bg-sky-500/80 hover:bg-sky-400",
    };
  }

  if ( token.includes( "fusion" ) ) {
    return {
      badgeClass: "border-fuchsia-300/30 bg-fuchsia-400/10 text-fuchsia-100",
      accentValueClass: "text-fuchsia-300",
      heroGlowClass: "from-fuchsia-400/25 via-indigo-400/12 to-transparent",
      buttonClass: "border-fuchsia-300/25 bg-fuchsia-500/80 hover:bg-fuchsia-400",
    };
  }

  return {
    badgeClass: "border-amber-300/30 bg-amber-400/10 text-amber-100",
    accentValueClass: "text-amber-300",
    heroGlowClass: "from-amber-300/28 via-indigo-400/12 to-transparent",
    buttonClass: "border-indigo-300/30 bg-indigo-500/80 hover:bg-indigo-400",
  };
};

const getCardProgressionLabel = ( cardData ) => {
  const token = `${ cardData?.frameType ?? "" } ${ cardData?.type ?? "" }`.toLowerCase();

  if ( token.includes( "link" ) ) {
    return "Link";
  }

  if ( token.includes( "xyz" ) ) {
    return "Rank";
  }

  return "Level";
};

const DetailBadge = ( { children, className = "" } ) => (
  <span
    className={ `inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.24em] ${ className }` }
  >
    { children }
  </span>
);

const DetailStatCard = ( {
  label,
  value,
  helper = "",
  valueClassName = "text-white",
} ) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-white/45">{ label }</p>
    <p className={ `mt-3 text-lg font-semibold leading-tight ${ valueClassName }` }>{ value }</p>
    { helper ? <p className="mt-2 text-xs leading-5 text-white/50">{ helper }</p> : null }
  </div>
);

const SectionEyebrow = ( { children } ) => (
  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/45">{ children }</p>
);

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

  const isCardRequestPending = Boolean( cardId ) && !cardData && !cardError;
  const isNameLookupPending = Boolean( shouldLookupByName ) && !cardLookupData && !cardLookupError;
  const isSetLookupPending = Boolean( setLookupParams ) && !cardSetLookupData && !cardSetLookupError;
  const isResolvingCardData =
    !cardData &&
    !cardLookupData &&
    !cardSetLookupData &&
    ( isCardRequestPending || isNameLookupPending || isSetLookupPending );

  const resolvedCardData = cardData || cardLookupData || cardSetLookupData;
  const resolvedCardError = resolvedCardData || isResolvingCardData
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

    const evaluateCandidate = ( setEntry ) => {
      const tokens = {
        setName: canonicalize( setEntry.set_name ),
        setNameLoose: canonicalizeLoose( setEntry.set_name ),
        setCode: canonicalize( setEntry.set_code ),
        setCodeLoose: canonicalizeLoose( setEntry.set_code ),
        rarity: canonicalize( setEntry.set_rarity ),
        rarityLoose: canonicalizeLoose( setEntry.set_rarity ),
        edition: canonicalize( setEntry.set_edition, { allowUnknown: true } ),
        editionLoose: canonicalizeLoose( setEntry.set_edition, { allowUnknown: true } ),
      };

      const matchesSetName =
        !queryTokens.setName ||
        tokens.setName === queryTokens.setName ||
        ( queryTokens.setNameLoose && tokens.setNameLoose === queryTokens.setNameLoose );

      if ( !matchesSetName ) {
        return { score: Number.NEGATIVE_INFINITY, set: setEntry };
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

      return { score, set: setEntry };
    };

    if ( hasQueryPreferences ) {
      let bestCandidate = { score: Number.NEGATIVE_INFINITY, set: null };

      for ( const setEntry of cardSets ) {
        const evaluated = evaluateCandidate( setEntry );
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
        const savedMatch = cardSets.find( ( setEntry ) => serializeVersion( setEntry ) === savedVersion );
        if ( savedMatch ) {
          commitSelection( savedVersion );
          return;
        }
      }
    }

    if ( queryTokens.setName ) {
      const matchBySetName = cardSets.find( ( setEntry ) => {
        const canonical = canonicalize( setEntry.set_name );
        const loose = canonicalizeLoose( setEntry.set_name );
        return (
          canonical === queryTokens.setName ||
          ( queryTokens.setNameLoose && loose === queryTokens.setNameLoose )
        );
      } );
      if ( matchBySetName ) {
        commitSelection( serializeVersion( matchBySetName ) );
        return;
      }
    }

    commitSelection( serializeVersion( cardSets[ 0 ] ) );
  }, [ resolvedCardData, effectiveCardId, set_name, set_code, resolvedRarityParam, edition ] );

  const handleVersionChange = ( event ) => {
    const newVersion = event.target.value;
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
    return resolvedCardData.card_sets.find( ( setEntry ) => serializeVersion( setEntry ) === selectedVersion );
  }, [ resolvedCardData, selectedVersion ] );

  const localImageSrc = activeCardId ? buildImagePath( activeCardId ) : null;
  const remoteImageSrc = resolvedCardData?.card_images?.[ 0 ]?.image_url || null;
  const primaryImageSrc = localImageSrc || remoteImageSrc || FALLBACK_IMAGE;
  const secondaryImageSrc = primaryImageSrc === localImageSrc ? remoteImageSrc : localImageSrc;

  const cardTheme = useMemo(
    () => resolveCardTheme( resolvedCardData?.frameType, resolvedCardData?.type ),
    [ resolvedCardData?.frameType, resolvedCardData?.type ]
  );

  const frameLabel = useMemo(
    () => formatTitleToken( resolvedCardData?.frameType || resolvedCardData?.type || "Card" ),
    [ resolvedCardData?.frameType, resolvedCardData?.type ]
  );

  const selectedEditionLabel = selectedSetDetails
    ? normalizeEditionLabel( selectedSetDetails.set_edition )
    : normalizeEditionLabel( edition );
  const selectedRarityLabel = selectedSetDetails?.set_rarity || resolvedRarityParam || "Unknown Rarity";
  const selectedMarketPriceLabel = formatCurrency( selectedSetDetails?.set_price, { allowZero: false } );
  const versionCount = resolvedCardData?.card_sets?.length || 0;
  const cardPriceSnapshot = resolvedCardData?.card_prices?.[ 0 ] || null;
  const typeDetailLabel = resolvedCardData?.type?.toLowerCase().includes( "monster" )
    ? "Monster Type"
    : "Card Trait";

  const traitBadges = useMemo( () => {
    const values = new Set();

    if ( Array.isArray( resolvedCardData?.typeline ) ) {
      resolvedCardData.typeline.forEach( ( entry ) => {
        if ( entry ) values.add( entry );
      } );
    }

    if ( resolvedCardData?.attribute ) {
      values.add( resolvedCardData.attribute );
    }

    if ( resolvedCardData?.race ) {
      values.add( resolvedCardData.race );
    }

    return Array.from( values ).slice( 0, 6 );
  }, [ resolvedCardData?.typeline, resolvedCardData?.attribute, resolvedCardData?.race ] );

  const heroCards = useMemo( () => {
    return [
      {
        label: "Selected Print",
        value: selectedRarityLabel,
        helper: selectedEditionLabel,
      },
      {
        label: "Set Number",
        value: selectedSetDetails?.set_code || set_code || "N/A",
        helper: selectedSetDetails?.set_name || set_name || "Unknown Set",
      },
      {
        label: "Versions Tracked",
        value: versionCount ? String( versionCount ) : "0",
        helper: versionCount === 1 ? "Single version available" : "Switch versions below",
      },
      {
        label: "Market Price",
        value: selectedMarketPriceLabel,
        helper: selectedMarketPriceLabel === "N/A" ? "No live market price on this print" : "Selected version market price",
        valueClassName: "text-emerald-300",
      },
    ];
  }, [
    selectedEditionLabel,
    selectedMarketPriceLabel,
    selectedRarityLabel,
    selectedSetDetails,
    set_code,
    set_name,
    versionCount,
  ] );

  const profileCards = useMemo( () => {
    const cards = [
      {
        label: "Card Type",
        value: resolvedCardData?.type || "N/A",
      },
      {
        label: typeDetailLabel,
        value: resolvedCardData?.race || "N/A",
      },
      {
        label: "Archetype",
        value: resolvedCardData?.archetype || "Unassigned",
      },
      {
        label: "Frame",
        value: frameLabel,
      },
    ];

    if ( hasDisplayValue( resolvedCardData?.attribute ) ) {
      cards.push( {
        label: "Attribute",
        value: resolvedCardData.attribute,
      } );
    }

    if ( hasDisplayValue( resolvedCardData?.linkval ) || hasDisplayValue( resolvedCardData?.level ) ) {
      cards.push( {
        label: getCardProgressionLabel( resolvedCardData ),
        value: formatStatValue( resolvedCardData?.linkval ?? resolvedCardData?.level ),
      } );
    }

    if ( hasDisplayValue( resolvedCardData?.scale ) ) {
      cards.push( {
        label: "Scale",
        value: formatStatValue( resolvedCardData.scale ),
      } );
    }

    if ( hasDisplayValue( resolvedCardData?.atk ) ) {
      cards.push( {
        label: "ATK",
        value: formatStatValue( resolvedCardData.atk ),
        valueClassName: cardTheme.accentValueClass,
      } );
    }

    if ( hasDisplayValue( resolvedCardData?.def ) ) {
      cards.push( {
        label: "DEF",
        value: formatStatValue( resolvedCardData.def ),
        valueClassName: cardTheme.accentValueClass,
      } );
    }

    if ( Array.isArray( resolvedCardData?.linkmarkers ) && resolvedCardData.linkmarkers.length > 0 ) {
      cards.push( {
        label: "Link Markers",
        value: resolvedCardData.linkmarkers.join( ", " ),
        helper: `${ resolvedCardData.linkmarkers.length } markers`,
      } );
    }

    return cards;
  }, [
    cardTheme.accentValueClass,
    frameLabel,
    resolvedCardData,
    typeDetailLabel,
  ] );

  const versionCards = useMemo( () => {
    return [
      {
        label: "Set",
        value: selectedSetDetails?.set_name || set_name || "Unknown Set",
      },
      {
        label: "Card Number",
        value: selectedSetDetails?.set_code || set_code || "N/A",
      },
      {
        label: "Rarity",
        value: selectedRarityLabel,
        helper: selectedSetDetails?.rarity_code ? `Code ${ selectedSetDetails.rarity_code }` : "",
      },
      {
        label: "Edition",
        value: selectedEditionLabel,
      },
      {
        label: "Selected Price",
        value: selectedMarketPriceLabel,
        helper: selectedMarketPriceLabel === "N/A" ? "Pricing unavailable for this print" : "Current market price",
        valueClassName: "text-emerald-300",
      },
    ];
  }, [
    selectedEditionLabel,
    selectedMarketPriceLabel,
    selectedRarityLabel,
    selectedSetDetails,
    set_code,
    set_name,
  ] );

  const marketplaceCards = useMemo( () => {
    const entries = [
      {
        label: "TCGPlayer",
        value: formatCurrency( cardPriceSnapshot?.tcgplayer_price, { allowZero: false } ),
      },
      {
        label: "eBay",
        value: formatCurrency( cardPriceSnapshot?.ebay_price, { allowZero: false } ),
      },
      {
        label: "Amazon",
        value: formatCurrency( cardPriceSnapshot?.amazon_price, { allowZero: false } ),
      },
    ].filter( ( entry ) => entry.value !== "N/A" );

    if ( entries.length > 0 ) {
      return entries;
    }

    return [
      {
        label: "Marketplace Snapshot",
        value: "No live pricing",
        helper: "Marketplace quotes will appear when available from the source feed.",
      },
    ];
  }, [ cardPriceSnapshot ] );

  const priceHistorySummary = useMemo( () => {
    const parsedHistory = Array.isArray( priceHistoryData?.priceHistory )
      ? priceHistoryData.priceHistory
        .map( ( entry ) => ( {
          date: new Date( entry?.date ),
          price: Number( entry?.price ),
        } ) )
        .filter( ( entry ) => !Number.isNaN( entry.date.getTime() ) && Number.isFinite( entry.price ) )
        .sort( ( left, right ) => left.date - right.date )
      : [];

    if ( parsedHistory.length === 0 ) {
      return null;
    }

    const prices = parsedHistory.map( ( entry ) => entry.price );
    const firstPrice = parsedHistory[ 0 ].price;
    const latestPrice = parsedHistory[ parsedHistory.length - 1 ].price;
    const uniqueDayCount = new Set(
      parsedHistory.map( ( entry ) => entry.date.toISOString().split( "T" )[ 0 ] )
    ).size;

    return {
      latestPrice,
      lowPrice: Math.min( ...prices ),
      highPrice: Math.max( ...prices ),
      changeAmount: latestPrice - firstPrice,
      trackedDays: uniqueDayCount,
    };
  }, [ priceHistoryData ] );

  const historyCards = useMemo( () => {
    if ( !priceHistorySummary ) {
      return [
        {
          label: "History Status",
          value: "No tracking yet",
          helper: "Snapshots appear after this print has recorded pricing history.",
        },
      ];
    }

    return [
      {
        label: "Current",
        value: formatCurrency( priceHistorySummary.latestPrice ),
        valueClassName: "text-emerald-300",
      },
      {
        label: "Range",
        value: `${ formatCurrency( priceHistorySummary.lowPrice ) } - ${ formatCurrency( priceHistorySummary.highPrice ) }`,
      },
      {
        label: "Change",
        value: formatSignedCurrency( priceHistorySummary.changeAmount ),
        helper: `${ priceHistorySummary.trackedDays } tracked days`,
        valueClassName:
          priceHistorySummary.changeAmount > 0
            ? "text-emerald-300"
            : priceHistorySummary.changeAmount < 0
              ? "text-rose-300"
              : "text-white",
      },
    ];
  }, [ priceHistorySummary ] );

  const heroDescription = useMemo( () => {
    const selectedSetName = selectedSetDetails?.set_name || set_name || "this set";
    const versionLabel = versionCount === 1 ? "version" : "versions";
    return `Inspect ${ selectedRarityLabel } printing details, compare market movement, and switch across ${ versionCount } tracked ${ versionLabel } from ${ selectedSetName }.`;
  }, [ selectedRarityLabel, selectedSetDetails?.set_name, set_name, versionCount ] );

  const handleImageError = ( event ) => {
    const image = event.currentTarget;
    const nextSrc = image.dataset.nextSrc;
    const fallbackSrc = image.dataset.fallbackSrc;

    if ( nextSrc ) {
      image.src = nextSrc;
      image.dataset.nextSrc = "";
      return;
    }

    if ( fallbackSrc ) {
      image.src = fallbackSrc;
      image.dataset.fallbackSrc = "";
      image.onerror = null;
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

  const shellHeader = useMemo( () => (
    <Breadcrumb
      className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8"
      items={ [
        { label: "Home", href: "/yugioh" },
        source === "collection"
          ? { label: "My Collection", href: "/yugioh/my-collection" }
          : { label: "Set Index", href: "/yugioh/sets/set-index" },
        source !== "collection" && set_name
          ? {
            label: set_name,
            href: `/yugioh/sets/${ encodeURIComponent( letter || "" ) }/${ encodeURIComponent( set_name ) }`,
          }
          : null,
        { label: resolvedCardData?.name || "Card Details", href: null },
      ].filter( Boolean ) }
    />
  ), [ letter, resolvedCardData?.name, set_name, source ] );

  const shellFooter = useMemo( () => (
    <Notification
      show={ notification.show }
      setShow={ updateNotificationVisibility }
      message={ notification.message }
    />
  ), [ notification.message, notification.show, updateNotificationVisibility ] );

  useAppShellSlots( {
    header: shellHeader,
    footer: shellFooter,
  } );

  if ( resolvedCardError ) {
    return (
      <div className="yugioh-bg flex min-h-screen items-center justify-center px-4 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-red-500/35 bg-black/45 p-8 text-center shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold">Unable to load card details</h1>
          <p className="mt-3 text-sm text-white/70">
            The card data request failed. Try again from the set page or refresh this card.
          </p>
        </div>
      </div>
    );
  }

  if ( !resolvedCardData ) {
    return (
      <div className="yugioh-bg flex min-h-screen items-center justify-center px-4 text-white">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-black/45 p-8 text-center shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold">Loading card details...</h1>
          <p className="mt-3 text-sm text-white/70">
            Fetching card information, artwork, and pricing history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{ `${ resolvedCardData.name } | Yu-Gi-Oh! Card Details` }</title>
        <meta
          name="description"
          content={ `Review artwork, print variants, market pricing, and history for ${ resolvedCardData.name }.` }
        />
      </Head>

      <div className="relative mx-auto min-h-screen overflow-hidden bg-fixed bg-cover yugioh-bg text-white">
        <div className="pointer-events-none absolute inset-0 bg-slate-950/75" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.2),transparent_34%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_center,rgba(245,158,11,0.12),transparent_42%)]" />

        <div className="relative">
          <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            <header className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur xl:p-8">
              <div className={ `pointer-events-none absolute inset-0 bg-gradient-to-br ${ cardTheme.heroGlowClass }` } />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%,rgba(255,255,255,0.02))]" />

              <div className="relative flex flex-col gap-8 xl:grid xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <DetailBadge className={ cardTheme.badgeClass }>{ frameLabel }</DetailBadge>
                    <DetailBadge className="border-white/15 bg-white/5 text-white/80">{ selectedRarityLabel }</DetailBadge>
                    <DetailBadge className="border-white/15 bg-white/5 text-white/80">{ selectedEditionLabel }</DetailBadge>
                  </div>

                  <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-white lg:text-5xl">
                    { resolvedCardData.name }
                  </h1>

                  <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
                    { heroDescription }
                  </p>

                  { traitBadges.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      { traitBadges.map( ( badge ) => (
                        <span
                          key={ badge }
                          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium text-white/80"
                        >
                          { badge }
                        </span>
                      ) ) }
                    </div>
                  ) }
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  { heroCards.map( ( cardEntry ) => (
                    <DetailStatCard
                      key={ cardEntry.label }
                      label={ cardEntry.label }
                      value={ cardEntry.value }
                      helper={ cardEntry.helper }
                      valueClassName={ cardEntry.valueClassName }
                    />
                  ) ) }
                </div>
              </div>
            </header>

            <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)]">
              <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
                <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-5 shadow-2xl backdrop-blur">
                  <div className={ `pointer-events-none absolute inset-x-8 top-6 h-28 rounded-full bg-gradient-to-r ${ cardTheme.heroGlowClass } blur-3xl opacity-80` } />

                  <div className="relative rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-white/10 via-black/55 to-black/75 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_20%,rgba(15,23,42,0.35))]" />
                    <img
                      src={ primaryImageSrc }
                      data-next-src={ secondaryImageSrc || "" }
                      data-fallback-src={ FALLBACK_IMAGE }
                      alt={ `${ resolvedCardData.name } card image` }
                      className="relative h-[30rem] w-full object-contain object-center"
                      loading="lazy"
                      decoding="async"
                      onError={ handleImageError }
                    />
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <DetailStatCard
                      label="Card ID"
                      value={ activeCardId || "Unavailable" }
                      helper={ activeCardId ? "Current Yu-Gi-Oh! card identifier" : "Identifier unavailable on this card." }
                    />
                    <DetailStatCard
                      label="Collection Status"
                      value={ isAuthenticated ? "Ready to add" : "Login required" }
                      helper={
                        isAuthenticated
                          ? "The selected version can be added directly."
                          : "Sign in to add this card to your collection."
                      }
                      valueClassName={ isAuthenticated ? cardTheme.accentValueClass : "text-white" }
                    />
                  </div>

                  <button
                    type="button"
                    onClick={ handleAddToCollection }
                    disabled={ isAddingToCollection || !selectedSetDetails }
                    className={ `mt-5 w-full rounded-full border px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${ cardTheme.buttonClass }` }
                  >
                    { isAddingToCollection ? "Adding..." : "Add to Collection" }
                  </button>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur">
                  <SectionEyebrow>Marketplace Snapshot</SectionEyebrow>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Live Price Cards</h2>
                  <p className="mt-3 text-sm leading-6 text-white/65">
                    Raw marketplace quotes for the current card listing.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    { marketplaceCards.map( ( cardEntry ) => (
                      <DetailStatCard
                        key={ cardEntry.label }
                        label={ cardEntry.label }
                        value={ cardEntry.value }
                        helper={ cardEntry.helper }
                        valueClassName={ cardEntry.valueClassName || "text-white" }
                      />
                    ) ) }
                  </div>
                </section>
              </aside>

              <div className="space-y-6">
                <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
                  <SectionEyebrow>Card Lore</SectionEyebrow>
                  <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <h2 className="text-2xl font-semibold text-white">Overview</h2>
                    <span className="text-sm text-white/55">{ frameLabel } profile</span>
                  </div>

                  <p className="mt-6 text-sm leading-8 text-white/82">
                    { resolvedCardData.desc || "No description available." }
                  </p>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.95fr)]">
                  <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
                    <SectionEyebrow>Card Profile</SectionEyebrow>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Facts & Stats</h2>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      Core card data, battle stats, and frame details from the active card entry.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      { profileCards.map( ( cardEntry ) => (
                        <DetailStatCard
                          key={ cardEntry.label }
                          label={ cardEntry.label }
                          value={ cardEntry.value }
                          helper={ cardEntry.helper }
                          valueClassName={ cardEntry.valueClassName }
                        />
                      ) ) }
                    </div>
                  </section>

                  <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
                    <SectionEyebrow>Print Explorer</SectionEyebrow>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Switch Version</h2>
                    <p className="mt-3 text-sm leading-6 text-white/65">
                      Change set code, rarity, and edition without leaving the page.
                    </p>

                    <div className="mt-5">
                      <label
                        htmlFor="card-version-select"
                        className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-white/50"
                      >
                        Selected Version
                      </label>
                      <select
                        id="card-version-select"
                        className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-sm text-white transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                        value={ selectedVersion ?? "" }
                        onChange={ handleVersionChange }
                      >
                        { resolvedCardData.card_sets?.map( ( setEntry, index ) => (
                          <option
                            key={ `${ setEntry.set_code }-${ setEntry.set_rarity }-${ index }` }
                            value={ serializeVersion( setEntry ) }
                          >
                            { setEntry.set_name } - { setEntry.set_code } - { setEntry.set_rarity } - { normalizeEditionLabel( setEntry.set_edition ) }
                          </option>
                        ) ) }
                      </select>
                    </div>

                    <div className="mt-5 grid gap-3">
                      { versionCards.map( ( cardEntry ) => (
                        <DetailStatCard
                          key={ cardEntry.label }
                          label={ cardEntry.label }
                          value={ cardEntry.value }
                          helper={ cardEntry.helper }
                          valueClassName={ cardEntry.valueClassName }
                        />
                      ) ) }
                    </div>
                  </section>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                      <SectionEyebrow>Pricing Intelligence</SectionEyebrow>
                      <h2 className="mt-2 text-2xl font-semibold text-white">Price History</h2>
                      <p className="mt-3 text-sm leading-6 text-white/65">
                        Trend the currently selected print over time and compare its tracked range.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[28rem]">
                      { historyCards.map( ( cardEntry ) => (
                        <DetailStatCard
                          key={ cardEntry.label }
                          label={ cardEntry.label }
                          value={ cardEntry.value }
                          helper={ cardEntry.helper }
                          valueClassName={ cardEntry.valueClassName }
                        />
                      ) ) }
                    </div>
                  </div>

                  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/35 p-4 sm:p-5">
                    <PriceHistoryChart
                      priceHistory={ priceHistoryData?.priceHistory || [] }
                      selectedVersion={ selectedVersion }
                      source={ "set" }
                    />
                  </div>
                </section>
              </div>
            </section>
          </main>
        </div>
      </div>

      <SpeedInsights />
    </>
  );
};

export const getServerSideProps = async () => {
  // Keep production client transitions on this page's own _next/data route.
  return {
    props: {},
  };
};

export default CardDetails;
