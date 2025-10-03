import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/router";
import { Grid, List } from "lucide-react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import Card from "@/components/Yugioh/Card";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import YugiohCardDataTable from "@/components/Yugioh/YugiohCardDataTable";
import Notification from "@/components/Notification";
import { fetchCardData as fetchAllCardData } from "@/utils/api";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { buildCollectionKey, buildCollectionMap } from "@/utils/collectionUtils.js";

const DEFAULT_AUTO_CONDITION = "";
const DEFAULT_AUTO_PRINTING = "";

const CONDITION_PRESETS = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
];

const PRINTING_PRESETS = [
  "1st Edition",
  "Limited",
  "Unlimited",
];

const normalizeNameKey = ( value = "" ) => value.toLowerCase().trim();
const stripExtraWhitespace = ( value = "" ) => value.replace( /\s+/g, " " ).trim();
const generateNameVariants = ( name = "" ) => {
  const normalized = normalizeNameKey( name );
  if ( !normalized ) return [];
  const variants = new Set( [ normalized ] );
  const withoutParens = stripExtraWhitespace( normalized.replace( /\s*\([^)]*\)\s*/g, " " ) );
  if ( withoutParens ) variants.add( withoutParens );
  const withoutBrackets = stripExtraWhitespace( normalized.replace( /\s*\[[^\]]*\]\s*/g, " " ) );
  if ( withoutBrackets ) variants.add( withoutBrackets );
  const withoutEditionWords = stripExtraWhitespace(
    normalized.replace( /\b(\d+(st|nd|rd|th)\s+edition|limited|unlimited|1st edition)\b/gi, " " )
  );
  if ( withoutEditionWords ) variants.add( withoutEditionWords );
  const withoutDashes = stripExtraWhitespace( normalized.replace( /-/g, " " ) );
  if ( withoutDashes ) variants.add( withoutDashes );
  const withoutQuotes = stripExtraWhitespace( normalized.replace( /['"]/g, "" ) );
  if ( withoutQuotes ) variants.add( withoutQuotes );
  const compact = normalized.replace( /[^a-z0-9]/g, "" );
  if ( compact ) variants.add( compact );
  return Array.from( variants );
};

const lookupCardMeta = ( productName = "", cardIndex = {} ) => {
  const variants = generateNameVariants( productName );
  for ( const key of variants ) {
    if ( key && cardIndex[ key ] ) {
      return cardIndex[ key ];
    }
  }
  return undefined;
};
const safeCompare = ( a, b ) => {
  const left = ( a || "" ).toString();
  const right = ( b || "" ).toString();
  return left.localeCompare( right );
};

const formatPriceLabel = ( value ) => {
  const numeric = Number( value );
  if ( Number.isFinite( numeric ) ) {
    return "$" + numeric.toFixed( 2 );
  }
  return "n/a";
};

const normalizeRarity = ( rarity ) => rarity || "Unknown Rarity";
const extractBaseCondition = ( condition, printing ) => {
  if ( !condition ) return "";
  if ( !printing ) return condition.trim();

  const trimmedCondition = condition.trim();
  const trimmedPrinting = printing.trim();
  const lowerCondition = trimmedCondition.toLowerCase();
  const lowerPrinting = trimmedPrinting.toLowerCase();

  if ( lowerCondition.endsWith( lowerPrinting ) ) {
    return trimmedCondition.slice( 0, trimmedCondition.length - trimmedPrinting.length ).trim();
  }

  return trimmedCondition;
};

const variantKey = ( variant ) => {
  return [
    variant.productID ?? "",
    variant.number ?? "",
    variant.printing ?? "",
    variant.baseCondition ?? "",
    variant.rarity ?? "",
  ].join( "|" );
};

const buildVariantLabel = ( variant ) => {
  const parts = [
    variant.baseCondition || "Unknown Condition",
    variant.printing || "Unknown Printing",
    variant.rarity || "Unknown Rarity",
  ];

  return parts.join( " - " );
};

const findBestVariant = ( variants = [], preferences = {} ) => {
  if ( !Array.isArray( variants ) || variants.length === 0 ) {
    return null;
  }

  const normalized = {
    condition:
      preferences.condition && preferences.condition !== ""
        ? preferences.condition
        : null,
    printing:
      preferences.printing && preferences.printing !== ""
        ? preferences.printing
        : null,
    rarity:
      preferences.rarity && preferences.rarity !== ""
        ? preferences.rarity
        : null,
  };

  const matches = ( variant, keys ) =>
    keys.every( ( key ) => {
      if ( !normalized[ key ] ) return true;
      if ( key === "condition" ) {
        return variant.baseCondition === normalized.condition;
      }
      return variant[ key ] === normalized[ key ];
    } );

  const priority = [
    [ "condition", "printing", "rarity" ],
    [ "condition", "printing" ],
    [ "condition", "rarity" ],
    [ "printing", "rarity" ],
    [ "condition" ],
    [ "printing" ],
    [ "rarity" ],
    [],
  ];

  for ( const combination of priority ) {
    const match = variants.find( ( variant ) => matches( variant, combination ) );
    if ( match ) {
      return match;
    }
  }

  return variants[ 0 ];
};

const aggregateEntries = ( entries = [], cardIndex = {} ) => {
  const grouped = new Map();

  entries.forEach( ( entry ) => {
    if ( !entry?.productName ) return;

    const productName = entry.productName.trim();
    const normalizedName = productName.toLowerCase();
    const baseCondition = extractBaseCondition( entry.condition, entry.printing );
    const variant = {
      ...entry,
      baseCondition,
    };

    const cardMeta = lookupCardMeta( productName, cardIndex );
    const productId = entry.productID || cardMeta?.id || null;

    if ( !grouped.has( productName ) ) {
      grouped.set( productName, {
        productId,
        productName,
        normalizedName,
        cardMeta,
        variants: [ variant ],
      } );
    } else {
      const existing = grouped.get( productName );
      existing.variants.push( variant );
      if ( !existing.cardMeta && cardMeta ) {
        existing.cardMeta = cardMeta;
      }
      if ( !existing.productId && productId ) {
        existing.productId = productId;
      }
    }
  } );

  return Array.from( grouped.values() )
    .map( ( card ) => {
      const sortedVariants = [ ...card.variants ].sort( ( a, b ) => {
        const printingCompare = safeCompare( a.printing, b.printing );
        if ( printingCompare !== 0 ) return printingCompare;

        const conditionCompare = safeCompare( a.baseCondition, b.baseCondition );
        if ( conditionCompare !== 0 ) return conditionCompare;

        return safeCompare( a.rarity, b.rarity );
      } );

      const productId = card.productId || card.cardMeta?.id || null;

      return {
        ...card,
        productId,
        variants: sortedVariants,
      };
    } )
    .sort( ( a, b ) => safeCompare( a.productName, b.productName ) );
};

const AUTO_RARITY_OPTION = null;

const CardsInSetPage = () => {
  const router = useRouter();
  const { setName } = router.query;

  const decodedSetName = useMemo( () => {
    if ( typeof setName === "string" ) {
      return decodeURIComponent( setName );
    }
    return "";
  }, [ setName ] );

  const [ cards, setCards ] = useState( [] );
  const [ rawEntries, setRawEntries ] = useState( [] );
  const [ cardIndex, setCardIndex ] = useState( {} );
  const [ resolvedSetName, setResolvedSetName ] = useState( [] );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ fetchError, setFetchError ] = useState( "" );
  const [ selectedCondition, setSelectedCondition ] = useState( null );
  const [ selectedPrinting, setSelectedPrinting ] = useState( null );
  const [ rarityOverrides, setRarityOverrides ] = useState( {} );
  const [ selectedNumbers, setSelectedNumbers ] = useState( [] );
  const [ numbersOpen, setNumbersOpen ] = useState( false );
  const [ selectedRowIds, setSelectedRowIds ] = useState( {} );
  const [ bulkSelections, setBulkSelections ] = useState( {} );
  const [ selectedCard, setSelectedCard ] = useState( null );
  const [ modalVariant, setModalVariant ] = useState( null );
  const [ modalVisible, setModalVisible ] = useState( false );
  const [ bulkModalVisible, setBulkModalVisible ] = useState( false );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ collectionCards, setCollectionCards ] = useState( [] );
  const [ gridSelectionMode, setGridSelectionMode ] = useState( false );
  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ sortBy, setSortBy ] = useState( "asc" );
  const [ viewMode, setViewMode ] = useState( "grid" );
  const [ isClient, setIsClient ] = useState( false );
  const [ notification, setNotification ] = useState( { show: false, message: "" } );

  const notify = useCallback( ( message ) => {
    if ( !message ) return;
    setNotification( { show: true, message } );
  }, [] );

  const updateNotificationVisibility = useCallback( ( showValue ) => {
    setNotification( ( prev ) => ( { ...prev, show: showValue } ) );
  }, [] );

  useEffect( () => {
    let isMounted = true;

    const loadCardIndex = async () => {
      try {
        const catalogue = await fetchAllCardData();
        if ( !isMounted ) {
          return;
        }

        if ( Array.isArray( catalogue ) ) {
          const index = {};
          catalogue.forEach( ( card ) => {
            if ( !card?.name ) return;
            const variants = generateNameVariants( card.name );
            variants.forEach( ( key ) => {
              if ( key && !index[ key ] ) {
                index[ key ] = card;
              }
            } );
          } );
          setCardIndex( index );
        } else {
          setCardIndex( {} );
        }
      } catch ( error ) {
        console.error( "Error loading card metadata:", error );
        if ( isMounted ) {
          setCardIndex( {} );
        }
      }
    };

    loadCardIndex();

    return () => {
      isMounted = false;
    };
  }, [] );

  const collectionLookup = useMemo( () => buildCollectionMap( collectionCards ), [ collectionCards ] );
  const activeSetDisplayName = resolvedSetName || decodedSetName || "Unknown Set";

  const preferences = useMemo( () => {
    const conditionPreference =
      selectedCondition && selectedCondition !== ""
        ? selectedCondition
        : DEFAULT_AUTO_CONDITION;
    const printingPreference =
      selectedPrinting && selectedPrinting !== ""
        ? selectedPrinting
        : DEFAULT_AUTO_PRINTING;
    return {
      condition: conditionPreference,
      printing: printingPreference,
    };
  }, [ selectedCondition, selectedPrinting ] );
  const makeOverrideKey = useCallback(
    ( productName ) => `${ productName }::${ activeSetDisplayName }`,
    [ activeSetDisplayName ]
  );

  const handleRarityOverrideChange = useCallback(
    ( productName, value ) => {
      const key = makeOverrideKey( productName );
      setRarityOverrides( ( prev ) => {
        const next = { ...prev };
        if ( !value || value === AUTO_RARITY_OPTION ) {
          delete next[ key ];
        } else {
          next[ key ] = value;
        }
        return next;
      } );
    },
    [ makeOverrideKey ]
  );
  useEffect( () => {
    if ( !decodedSetName ) return;
    let isMounted = true;

    const loadData = async () => {
      setIsLoading( true );
      setFetchError( "" );

      try {
        const mapResponse = await fetch( "/api/Yugioh/setNameIdMap" );
        if ( !mapResponse.ok ) {
          throw new Error( "Failed to load set catalogue" );
        }

        const setMap = await mapResponse.json();
        const match = Object.entries( setMap || {} ).find( ( [ name ] ) =>
          name.toLowerCase() === decodedSetName.toLowerCase()
        );

        if ( !match ) {
          throw new Error( "Set not found in catalogue" );
        }

        const [ officialName, setId ] = match;

        if ( !setId ) {
          throw new Error( "Missing set identifier" );
        }

        const priceResponse = await fetch( `/api/Yugioh/cards/${ setId }` );
        if ( !priceResponse.ok ) {
          throw new Error( "Failed to load pricing" );
        }

        const payload = await priceResponse.json();
        const results = Array.isArray( payload ) ? payload : payload?.result;

        if ( !Array.isArray( results ) ) {
          throw new Error( "Unexpected response format" );
        }

        if ( isMounted ) {
          setResolvedSetName( officialName );
          setRawEntries( results );
          setSelectedRowIds( {} );
          setBulkSelections( {} );
          setSelectedNumbers( [] );
          setSelectedCondition( DEFAULT_AUTO_CONDITION );
          setSelectedPrinting( DEFAULT_AUTO_PRINTING );
          setRarityOverrides( {} );
          setGridSelectionMode( false );
        }
      } catch ( error ) {
        console.error( "Error loading set pricing:", error );
        if ( isMounted ) {
          setRawEntries( [] );
          setCards( [] );
          setFetchError( error?.message || "Unable to load pricing data for this set." );
        }
      } finally {
        if ( isMounted ) {
          setIsLoading( false );
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [ decodedSetName ] );

  useEffect( () => {
    if ( !Array.isArray( rawEntries ) || rawEntries.length === 0 ) {
      setCards( [] );
      return;
    }

    setCards( aggregateEntries( rawEntries, cardIndex ) );
  }, [ rawEntries, cardIndex ] );

  useEffect( () => {
    const checkAuth = async () => {
      try {
        const res = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include",
        } );
        setIsAuthenticated( res.ok );
      } catch {
        setIsAuthenticated( false );
      }
    };

    checkAuth();
  }, [] );

  useEffect( () => {
    if ( !isAuthenticated ) {
      setCollectionCards( [] );
      return;
    }

    const fetchCollectionCards = async () => {
      try {
        const response = await fetch( "/api/Yugioh/my-collection", {
          method: "GET",
          credentials: "include",
        } );

        if ( !response.ok ) {
          setCollectionCards( [] );
          return;
        }

        const data = await response.json();
        setCollectionCards( data );
      } catch ( error ) {
        console.error( "Failed to load collection for set view:", error );
        setCollectionCards( [] );
      }
    };

    fetchCollectionCards();
  }, [ isAuthenticated ] );

  useEffect( () => {
    if ( viewMode !== "grid" ) {
      setGridSelectionMode( false );
    }
  }, [ viewMode ] );

  useEffect( () => {
    setSelectedRowIds( {} );
    setBulkSelections( {} );
  }, [ selectedCondition, selectedPrinting, rarityOverrides ] );



  const variantAvailability = useMemo( () => {
    const allConditions = new Set();
    const allPrintings = new Set();

    cards.forEach( ( card ) => {
      card.variants.forEach( ( variant ) => {
        const conditionToken = variant.baseCondition?.trim();
        const printingToken = variant.printing?.trim();

        if ( conditionToken ) {
          allConditions.add( conditionToken );
        }

        if ( printingToken ) {
          allPrintings.add( printingToken );
        }
      } );
    } );

    return {
      allConditions,
      allPrintings,
    };
  }, [ cards ] );

  const conditionOptions = useMemo( () => {
    const pool = new Set( CONDITION_PRESETS );
    variantAvailability.allConditions.forEach( ( value ) => pool.add( value ) );

    const sorted = Array.from( pool ).filter( Boolean ).sort( ( a, b ) => safeCompare( a, b ) );

    return [ DEFAULT_AUTO_CONDITION, ...sorted ];
  }, [ variantAvailability ] );

  const printingOptions = useMemo( () => {
    const pool = new Set( PRINTING_PRESETS );
    variantAvailability.allPrintings.forEach( ( value ) => pool.add( value ) );

    const sorted = Array.from( pool ).filter( Boolean ).sort( ( a, b ) => safeCompare( a, b ) );

    return [ DEFAULT_AUTO_PRINTING, ...sorted ];
  }, [ variantAvailability ] );



  const availableNumbers = useMemo( () => {
    const values = new Set();
    cards.forEach( ( card ) => {
      card.variants.forEach( ( variant ) => {
        if ( variant.number ) {
          values.add( variant.number );
        }
      } );
    } );
    return Array.from( values ).sort( ( a, b ) => safeCompare( a, b ) );
  }, [ cards ] );

  useEffect( () => {
    if ( !conditionOptions.includes( selectedCondition ) ) {
      setSelectedCondition( DEFAULT_AUTO_CONDITION );
    }
  }, [ conditionOptions, selectedCondition ] );

  useEffect( () => {
    if ( !printingOptions.includes( selectedPrinting ) ) {
      setSelectedPrinting( DEFAULT_AUTO_PRINTING );
    }
  }, [ printingOptions, selectedPrinting ] );



  const makeCollectionKey = useCallback( ( productName, variant ) =>
    buildCollectionKey( {
      productName,
      setName: activeSetDisplayName,
      number: variant?.number || "",
      printing: variant?.printing || "Unknown Edition",
    } ), [ activeSetDisplayName ] );
  const processedCards = useMemo( () => {
    let data = cards;

    if ( searchTerm ) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter( ( card ) => {
        if ( card.productName.toLowerCase().includes( term ) ) return true;
        const meta = card.cardMeta;
        if ( meta?.type && meta.type.toLowerCase().includes( term ) ) return true;
        if ( meta?.archetype && meta.archetype.toLowerCase().includes( term ) ) return true;
        return false;
      } );
    }

    if ( selectedNumbers.length > 0 ) {
      data = data.filter( ( card ) =>
        card.variants.some( ( variant ) => selectedNumbers.includes( variant.number ) )
      );
    }

    const sorted = [ ...data ];
    if ( sortBy === "asc" ) {
      sorted.sort( ( a, b ) => safeCompare( a.productName, b.productName ) );
    } else if ( sortBy === "desc" ) {
      sorted.sort( ( a, b ) => safeCompare( b.productName, a.productName ) );
    }

    return sorted
      .map( ( card ) => {
        const primaryImageId = card.cardMeta?.card_images?.[ 0 ]?.id || null;
        const remoteImageUrl = card.cardMeta?.card_images?.[ 0 ]?.image_url || null;
        const overrideKey = makeOverrideKey( card.productName );
        const forcedRarity = rarityOverrides[ overrideKey ];
        const desiredRarity = forcedRarity || null;

        const raritySet = new Set();
        card.variants.forEach( ( variant ) => {
          raritySet.add( normalizeRarity( variant.rarity ) );
        } );
        const rarityOptions = Array.from( raritySet ).sort( ( a, b ) => safeCompare( a, b ) );
        const hasMultipleRarities = rarityOptions.length > 1;

        const desiredCondition = preferences.condition || DEFAULT_AUTO_CONDITION;
        const desiredPrinting = preferences.printing || DEFAULT_AUTO_PRINTING;

        const variants = card.variants || [];
        const exactVariant = variants.find( ( variant ) => {
          const rarityMatches = desiredRarity ? normalizeRarity( variant.rarity ) === desiredRarity : true;
          const conditionMatches = desiredCondition ? variant.baseCondition === desiredCondition : true;
          const printingMatches = desiredPrinting ? variant.printing === desiredPrinting : true;
          return rarityMatches && conditionMatches && printingMatches;
        } );

        let fallbackVariant = exactVariant;

        if ( !fallbackVariant && desiredRarity ) {
          fallbackVariant = variants.find(
            ( variant ) =>
              normalizeRarity( variant.rarity ) === desiredRarity &&
              ( !desiredCondition || variant.baseCondition === desiredCondition || !desiredPrinting || variant.printing === desiredPrinting )
          );
        }

        if ( !fallbackVariant ) {
          fallbackVariant = variants.find(
            ( variant ) =>
              ( !desiredCondition || variant.baseCondition === desiredCondition ) &&
              ( !desiredPrinting || variant.printing === desiredPrinting )
          );
        }

        if ( !fallbackVariant ) {
          fallbackVariant = findBestVariant( variants, {
            ...preferences,
            rarity: desiredRarity || undefined,
          } );
        }

        if ( !fallbackVariant && variants[ 0 ] ) {
          fallbackVariant = variants[ 0 ];
        }

        const templateVariant = fallbackVariant || variants[ 0 ] || {};
        const resolvedVariant = exactVariant || fallbackVariant || null;
        const activeVariant = exactVariant
          ? { ...exactVariant }
          : {
            ...templateVariant,
            productName: card.productName,
            productID: templateVariant.productID ?? card.productId,
            number: templateVariant.number || "",
            baseCondition: desiredCondition || templateVariant.baseCondition || "",
            printing: desiredPrinting || templateVariant.printing || "",
            rarity: desiredRarity || normalizeRarity( templateVariant.rarity ),
            marketPrice: null,
            lowPrice: null,
          };

        if ( !exactVariant && desiredRarity && normalizeRarity( activeVariant.rarity ) !== desiredRarity ) {
          activeVariant.rarity = desiredRarity;
        }

        if ( !exactVariant ) {
          activeVariant.baseCondition = desiredCondition || activeVariant.baseCondition;
          activeVariant.printing = desiredPrinting || activeVariant.printing;
          activeVariant.marketPrice = null;
          activeVariant.lowPrice = null;
        }

        const selectionParts = [];
        if ( desiredCondition ) selectionParts.push( desiredCondition );
        if ( desiredPrinting ) selectionParts.push( desiredPrinting );
        if ( desiredRarity ) selectionParts.push( desiredRarity );
        const selectionLabel = selectionParts.join( " / " );
        const selectionMissing = selectionParts.length > 0 && !exactVariant;

        const selectedRarity = desiredRarity || normalizeRarity( activeVariant.rarity );
        const selectedRarityOption = forcedRarity || AUTO_RARITY_OPTION;

        const collectionKey = makeCollectionKey( card.productName, activeVariant );
        const cardDetailId =
          card.cardMeta?.id ||
          primaryImageId ||
          card.productId ||
          templateVariant?.productID ||
          null;

        const cardImageId = primaryImageId || cardDetailId;

        return {
          ...card,
          activeVariant,
          resolvedVariant,
          collectionKey,
          cardImageId,
          cardDetailId,
          remoteImageUrl,
          rarityOptions,
          hasMultipleRarities,
          selectedRarity,
          selectedRarityOption,
          selectionLabel,
          selectionMissing,
        };
      } )
      .filter( Boolean );
  }, [ cards, searchTerm, selectedNumbers, sortBy, preferences, makeCollectionKey, rarityOverrides, makeOverrideKey ] );

  useEffect( () => {
    if ( !selectedCard ) return;
    const latest = processedCards.find(
      ( card ) => card.productName === selectedCard.productName
    );
    if ( !latest ) return;
    if ( latest.collectionKey !== selectedCard.collectionKey ) {
      setSelectedCard( latest );
      setModalVariant( latest.activeVariant || latest.variants?.[ 0 ] || null );
    }
  }, [ processedCards, selectedCard ] );

  const matchedCardData = useMemo( () =>
    processedCards.map( ( card ) => {
      const variant = card.activeVariant;
      const conditionLabel = variant
        ? [ variant.baseCondition, variant.printing ].filter( Boolean ).join( " " )
        : "Unknown Condition";

      return {
        card: {
          productName: card.productName,
          setName: activeSetDisplayName,
          number: variant?.number || "",
          printing: variant?.printing || "Unknown Edition",
          rarity: variant?.rarity || "Unknown Rarity",
          condition: conditionLabel || "Unknown Condition",
        },
        data: {
          marketPrice: variant?.marketPrice ?? null,
          lowPrice: variant?.lowPrice ?? null,
        },
        collectionKey: card.collectionKey,
        variant,
        resolvedVariant: card.resolvedVariant,
        variants: card.variants,
        rarityOptions: card.rarityOptions,
        selectedRarityOption: card.selectedRarityOption,
        selectedRarity: card.selectedRarity,
        hasMultipleRarities: card.hasMultipleRarities,
        productName: card.productName,
      };
    } ),
    [ processedCards, activeSetDisplayName ] );

  const getSelectedCards = useCallback( () =>
    matchedCardData.filter( ( row ) => selectedRowIds[ row.collectionKey ] ),
    [ matchedCardData, selectedRowIds ] );

  const toggleSelection = useCallback( ( key ) => {
    setSelectedRowIds( ( prev ) => {
      const next = { ...prev };
      if ( next[ key ] ) {
        delete next[ key ];
      } else {
        next[ key ] = true;
      }
      return next;
    } );
  }, [] );
  const openModal = useCallback( ( card ) => {
    setSelectedCard( card );
    setModalVariant( card.activeVariant || card.variants?.[ 0 ] || null );
    setModalVisible( true );
  }, [] );

  const closeModal = useCallback( () => {
    setModalVisible( false );
    setSelectedCard( null );
    setModalVariant( null );
  }, [] );

  const modalOptions = useMemo( () => {
    if ( !selectedCard ) {
      return { conditions: [], printings: [], rarities: [] };
    }

    const conditions = new Set();
    const printings = new Set();
    const rarities = new Set();

    selectedCard.variants.forEach( ( variant ) => {
      if ( variant.baseCondition ) conditions.add( variant.baseCondition );
      if ( variant.printing ) printings.add( variant.printing );
      if ( variant.rarity ) rarities.add( variant.rarity );
    } );

    return {
      conditions: Array.from( conditions ).sort( ( a, b ) => safeCompare( a, b ) ),
      printings: Array.from( printings ).sort( ( a, b ) => safeCompare( a, b ) ),
      rarities: Array.from( rarities ).sort( ( a, b ) => safeCompare( a, b ) ),
    };
  }, [ selectedCard ] );

  const updateModalVariant = useCallback( ( updates ) => {
    if ( !selectedCard ) return;

    const condition = updates.condition ?? modalVariant?.baseCondition ?? null;
    const printing = updates.printing ?? modalVariant?.printing ?? null;
    const rarity = updates.rarity ?? modalVariant?.rarity ?? null;

    const resolvedVariant = findBestVariant( selectedCard.variants, {
      condition: condition || "All",
      printing: printing || "All",
      rarity: rarity || "All",
    } );

    if ( resolvedVariant ) {
      setModalVariant( resolvedVariant );
      handleRarityOverrideChange(
        selectedCard.productName,
        resolvedVariant.rarity || AUTO_RARITY_OPTION
      );
    }
  }, [ modalVariant, selectedCard, handleRarityOverrideChange ] );

  const handleAddToCollection = useCallback( async () => {
    if ( !selectedCard || !modalVariant ) {
      notify( "Please choose a printing, rarity, and condition before adding." );
      return;
    }

    try {
      const response = await fetch( "/api/Yugioh/cards", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( {
          cards: [
            {
              productName: selectedCard.productName,
              setName: modalVariant.set || activeSetDisplayName,
              number: modalVariant.number || "",
              printing: modalVariant.printing || "Unknown Edition",
              rarity: modalVariant.rarity || "Unknown Rarity",
              condition:
                [ modalVariant.baseCondition, modalVariant.printing ]
                  .filter( Boolean )
                  .join( " " ) || "Unknown Condition",
              marketPrice: modalVariant.marketPrice || 0,
              quantity: 1,
            },
          ],
        } ),
      } );

      if ( !response.ok ) {
        throw new Error( "Failed to add card to collection" );
      }

      notify( "Card added!" );
      closeModal();
    } catch ( error ) {
      console.error( error );
      notify( "Failed to add card. Try again." );
    }
  }, [ selectedCard, modalVariant, activeSetDisplayName, closeModal, notify ] );

  const closeBulkModal = useCallback( () => {
    setBulkModalVisible( false );
    setBulkSelections( {} );
  }, [] );

  const openBulkModal = useCallback( () => {
    const selected = getSelectedCards();
    if ( selected.length === 0 ) {
      notify( "No cards selected." );
      return;
    }

    const initial = {};
    selected.forEach( ( row ) => {
      initial[ row.card.productName ] =
        row.resolvedVariant || row.variant || row.variants?.[ 0 ];
    } );

    setBulkSelections( initial );
    setBulkModalVisible( true );
  }, [ getSelectedCards, notify ] );

  const handleBulkSubmit = useCallback( async ( event ) => {
    event.preventDefault();
    const selected = getSelectedCards();
    if ( selected.length === 0 ) {
      notify( "No cards selected." );
      return;
    }

    const payload = selected
      .map( ( row ) => {
        const variant =
          bulkSelections[ row.card.productName ] ||
          row.variant ||
          row.variants?.[ 0 ];

        if ( !variant ) {
          return null;
        }

        return {
          productName: row.card.productName,
          setName: variant.set || activeSetDisplayName,
          number: variant.number || "",
          printing: variant.printing || "Unknown Edition",
          rarity: variant.rarity || "Unknown Rarity",
          condition:
            [ variant.baseCondition, variant.printing ]
              .filter( Boolean )
              .join( " " ) || "Unknown Condition",
          marketPrice: variant.marketPrice || 0,
          quantity: 1,
        };
      } )
      .filter( Boolean );

    if ( payload.length === 0 ) {
      notify( "No valid selections to add." );
      return;
    }

    try {
      const response = await fetch( "/api/Yugioh/cards", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( { cards: payload } ),
      } );

      if ( !response.ok ) {
        throw new Error( "Bulk add failed" );
      }

      notify( `Added ${ payload.length } cards!` );
      setSelectedRowIds( {} );
      setBulkSelections( {} );
      closeBulkModal();
    } catch ( error ) {
      console.error( error );
      notify( "Error adding cards. Try again." );
    }
  }, [ getSelectedCards, bulkSelections, activeSetDisplayName, closeBulkModal, notify ] );

  const renderGridCard = useCallback( ( cardItem ) => {
    const selectionKey = cardItem.collectionKey;
    const isSelected = Boolean( selectedRowIds[ selectionKey ] );
    const isCollected = Boolean( collectionLookup[ selectionKey ] );
    const hasImage = Boolean( cardItem.cardImageId || cardItem.remoteImageUrl );
    const cardPayload = { id: cardItem.cardImageId, detailId: cardItem.cardDetailId, fallbackId: cardItem.cardDetailId, remoteUrl: cardItem.remoteImageUrl, fallbackRemoteUrl: cardItem.remoteImageUrl, productName: cardItem.productName, name: cardItem.productName, };
    const raritySelectValue = cardItem.selectedRarityOption || AUTO_RARITY_OPTION;
    const currentRarityLabel = cardItem.selectedRarity || "Unknown Rarity";
    const activeVariant = cardItem.activeVariant || null;

    const detailLineParts = [];
    if ( cardItem.cardNumber ) {
      detailLineParts.push( `Card #${ cardItem.cardNumber }` );
    }
    if ( activeVariant?.rarity ) {
      detailLineParts.push( activeVariant.rarity );
    } else if ( cardItem.selectedRarity ) {
      detailLineParts.push( cardItem.selectedRarity );
    }
    if ( activeVariant?.printing ) {
      detailLineParts.push( activeVariant.printing );
    }

    const detailLine = detailLineParts.join( " - " );
    const overlayLabel = activeVariant ? buildVariantLabel( activeVariant ) : currentRarityLabel;
    const cardContainerClasses = [
      "relative h-auto w-full object-scale-down overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-lg transition duration-200 group-hover:border-indigo-400/60 dark:border-white/20 dark:bg-gray-900/60",
      isSelected ? "ring-2 ring-indigo-400/70" : "",
    ].filter( Boolean ).join( " " );

    return (
      <div
        key={ selectionKey }
        className="group relative flex flex-col border border-white/10 bg-black/40 p-4 transition hover:border-indigo-400/50 sm:p-6"
      >
        <div className="relative">
          <div className={ cardContainerClasses }>
            { isCollected && (
              <span className="absolute left-3 top-3 z-20 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                In Collection
              </span>
            ) }
            { gridSelectionMode && isAuthenticated && (
              <button
                type="button"
                className="multi-select-checkbox absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full border border-white/40 bg-black/60 text-white transition hover:bg-black/70"
                onClick={ ( event ) => {
                  event.stopPropagation();
                  toggleSelection( selectionKey );
                } }
                aria-pressed={ isSelected }
                aria-label={ isSelected ? "Deselect card" : "Select card" }
              >
                <input type="checkbox" checked={ isSelected } readOnly className="pointer-events-none" />
              </button>
            ) }
            <div className="size-full">
              { hasImage ? (
                <Card cardData={ cardPayload } as="image" source="set" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-300">
                  Image unavailable
                </div>
              ) }
            </div>
            { activeVariant && (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex h-72 items-end justify-start overflow-hidden rounded-lg p-4">
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-90" />
                <div className="relative flex flex-col gap-1 text-white">
                  <p className="text-lg font-semibold">{ formatPriceLabel( activeVariant.marketPrice ) }</p>
                  { overlayLabel && (
                    <p className="text-xs font-medium uppercase tracking-wide">{ overlayLabel }</p>
                  ) }
                </div>
              </div>
            ) }
          </div>
          <div className="relative mt-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{ cardItem.productName }</h3>
            { detailLine && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{ detailLine }</p>
            ) }
            { cardItem.selectionMissing && (
              <p className="mt-1 text-xs font-semibold text-amber-500 dark:text-amber-300">
                { cardItem.selectionLabel
                  ? `No pricing data for ${ cardItem.selectionLabel }. Showing closest match.`
                  : "No pricing data for the selected filters. Showing closest match." }
              </p>
            ) }
          </div>
          { cardItem.hasMultipleRarities && (
            <div className="mt-4 space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100">
                Multiple rarities available
              </span>
              <label className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-300">
                Select Rarity
                <select
                  className="rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-white/10 dark:bg-gray-900 dark:text-white"
                  value={ raritySelectValue }
                  onChange={ ( event ) => handleRarityOverrideChange( cardItem.productName, event.target.value ) }
                >
                  <option value={ AUTO_RARITY_OPTION }>{ `Auto (${ currentRarityLabel })` }</option>
                  { cardItem.rarityOptions.map( ( option ) => (
                    <option key={ option } value={ option }>{ option }</option>
                  ) ) }
                </select>
              </label>
            </div>
          ) }
        </div>
        { isAuthenticated && (
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="relative flex w-full items-center justify-center rounded-md border border-transparent bg-gray-900 px-8 py-2 text-sm font-medium text-white transition hover:bg-gray-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              onClick={ () => openModal( cardItem ) }
            >
              Add to Collection
              <span className="sr-only">, { cardItem.productName }</span>
            </button>
            { gridSelectionMode && (
              <button
                type="button"
                className={ `relative flex w-full items-center justify-center rounded-md border px-8 py-2 text-sm font-medium transition ${ isSelected
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-400 dark:bg-indigo-400/20 dark:text-indigo-100"
                  : "border-gray-300 bg-white text-gray-900 hover:bg-gray-100 dark:border-white/10 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
                  }` }
                onClick={ () => toggleSelection( selectionKey ) }
              >
                { isSelected ? "Selected" : "Select" }
              </button>
            ) }
          </div>
        ) }
      </div>
    );
  }, [ collectionLookup, gridSelectionMode, isAuthenticated, selectedRowIds, toggleSelection, openModal, handleRarityOverrideChange ] );
  return (
    <>
      <Notification
        show={ notification.show }
        setShow={ updateNotificationVisibility }
        message={ notification.message }
      />

      <div className="mx-auto min-h-max w-full yugioh-bg bg-fixed overflow-clip">
        <Breadcrumb />
        <main className="pb-24">
          <div className="px-4 py-16 text-center sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Cards in { activeSetDisplayName }
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/70">
              Explore { processedCards.length || 0 } card listings with live pricing and quick filters.
            </p>
          </div>

          <section aria-labelledby="filter-heading" className="border-y border-white/10 bg-black/40 backdrop-blur">
            <h2 id="filter-heading" className="sr-only">Filters</h2>
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  <span className="font-medium uppercase tracking-wide text-white/50">View</span>
                  <div
                    role="group"
                    className="flex items-center rounded-full border border-white/15 bg-white/10 shadow-sm backdrop-blur"
                  >
                    <button
                      type="button"
                      onClick={ () => setViewMode( "grid" ) }
                      title="Grid view"
                      className={ `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${ viewMode === "grid"
                        ? "bg-indigo-500/80 text-white shadow"
                        : "text-white/70 hover:text-white"
                        }` }
                    >
                      <Grid size={ 20 } />
                      Grid
                    </button>
                    <button
                      type="button"
                      onClick={ () => setViewMode( "table" ) }
                      title="Table view"
                      className={ `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${ viewMode === "table"
                        ? "bg-indigo-500/80 text-white shadow"
                        : "text-white/70 hover:text-white"
                        }` }
                    >
                      <List size={ 20 } />
                      Table
                    </button>
                  </div>
                  <div className="hidden h-6 w-px bg-white/20 sm:block" />
                  <div className="relative">
                    <button
                      type="button"
                      onClick={ () => setNumbersOpen( ( open ) => !open ) }
                      className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70"
                      aria-expanded={ numbersOpen }
                      aria-haspopup="true"
                    >
                      Card Numbers
                    </button>
                    { numbersOpen && (
                      <div className="absolute left-0 z-50 mt-3 w-64 max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/90 p-4 text-sm text-white/80 shadow-2xl backdrop-blur">
                        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
                          <button
                            type="button"
                            onClick={ () => setSelectedNumbers( [] ) }
                            className="font-medium text-red-300 transition hover:text-red-200"
                          >
                            Clear All
                          </button>
                          <button
                            type="button"
                            onClick={ () => setNumbersOpen( false ) }
                            className="font-medium text-indigo-300 transition hover:text-indigo-200"
                          >
                            Done
                          </button>
                        </div>
                        <div className="space-y-2">
                          { availableNumbers.map( ( num ) => (
                            <label
                              key={ num }
                              className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white/80 hover:border-white/30"
                            >
                              <input
                                type="checkbox"
                                checked={ selectedNumbers.includes( num ) }
                                onChange={ ( event ) =>
                                  setSelectedNumbers( ( prev ) =>
                                    event.target.checked
                                      ? [ ...prev, num ]
                                      : prev.filter( ( value ) => value !== num )
                                  )
                                }
                              />
                              { num }
                            </label>
                          ) ) }
                        </div>
                      </div>
                    ) }
                  </div>
                </div>
                { viewMode === "grid" && isAuthenticated && (
                  <button
                    type="button"
                    onClick={ () => setGridSelectionMode( ( prev ) => !prev ) }
                    className={ `inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition ${ gridSelectionMode
                      ? "bg-indigo-500/80 text-white shadow hover:bg-indigo-500"
                      : "border border-white/20 bg-white/10 text-white/80 hover:border-white/40 hover:text-white"
                      }` }
                  >
                    { gridSelectionMode ? "Done Selecting" : "Enable Multi-Select" }
                  </button>
                ) }
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5 w-fit">
                <div className="md:col-span-2 lg:col-span-2">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-1 shadow-inner backdrop-blur">
                    <YugiohSearchBar onSearch={ setSearchTerm } />
                  </div>
                </div>
                <div className="flex flex-col text-sm text-white/80">
                  <span className="font-medium text-white/70">Condition</span>
                  <select
                    value={ selectedCondition }
                    onChange={ ( event ) => setSelectedCondition( event.target.value ) }
                    className="mt-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  >
                    { conditionOptions.map( ( option ) => (
                      <option className="bg-black text-white" key={ option } value={ option }>{ option === DEFAULT_AUTO_CONDITION ? "All Conditions" : option }</option>
                    ) ) }
                  </select>
                </div>
                <div className="flex flex-col text-sm text-white/80">
                  <span className="font-medium text-white/70">Printing</span>
                  <select
                    value={ selectedPrinting }
                    onChange={ ( event ) => setSelectedPrinting( event.target.value ) }
                    className="mt-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  >
                    { printingOptions.map( ( option ) => (
                      <option className="bg-black text-white" key={ option } value={ option }>{ option === DEFAULT_AUTO_PRINTING ? "All Printings" : option }</option>
                    ) ) }
                  </select>
                </div>
                <div className="flex flex-col text-sm text-white/80">
                  <span className="font-medium text-white/70">Sort</span>
                  <select
                    value={ sortBy }
                    onChange={ ( event ) => setSortBy( event.target.value ) }
                    className="mt-2 rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                  >
                    <option value="asc">Name (A-Z)</option>
                    <option value="desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>

              { selectedNumbers.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 text-sm z-50">
                  { selectedNumbers.map( ( num ) => (
                    <span
                      key={ num }
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 shadow-sm"
                    >
                      { num }
                      <button
                        type="button"
                        onClick={ () =>
                          setSelectedNumbers( ( prev ) => prev.filter( ( value ) => value !== num ) )
                        }
                        className="text-xs text-red-300 transition hover:text-red-200"
                      >
                        x
                      </button>
                    </span>
                  ) ) }
                </div>
              ) }
            </div>
          </section>

          <section aria-labelledby="cards-heading" className="mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <h2 id="cards-heading" className="sr-only">Card Results</h2>

            { fetchError && (
              <div className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100 shadow-lg">
                { fetchError }
              </div>
            ) }

            { isLoading ? (
              <div className="min-h-screen py-16 text-center text-white/70">Loading latest prices...</div>
            ) : processedCards.length === 0 ? (
              <div className="min-h-screen py-16 text-center text-white/70">
                No cards found for this set with the selected filters.
              </div>
            ) : viewMode === "grid" ? (
              <div className="w-auto overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
                <div className=" grid grid-cols-1 border-l border-white/5 sm:mx-0 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  { processedCards.map( ( cardItem ) => renderGridCard( cardItem ) ) }
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl">
                <Suspense fallback={ <div className="py-10 text-center text-white/70">Loading...</div> }>
                  <YugiohCardDataTable
                    matchedCardData={ matchedCardData }
                    selectedRowIds={ selectedRowIds }
                    setSelectedRowIds={ setSelectedRowIds }
                    collectionMap={ collectionLookup }
                    onRarityChange={ handleRarityOverrideChange }
                    autoRarityOptionValue={ AUTO_RARITY_OPTION }
                  />
                </Suspense>
              </div>
            ) }
          </section>

          { Object.values( selectedRowIds ).some( Boolean ) &&
            ( viewMode === "table" || ( viewMode === "grid" && gridSelectionMode ) ) && (
              <div className="mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 p-6 text-center shadow-lg">
                  <button onClick={ openBulkModal } className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-400">
                    Add Selected to Collection
                  </button>
                </div>
              </div>
            ) }
        </main>
        { modalVisible && selectedCard && (
          <div className="sticky inset-0 z-50 flex items-start justify-center bg-black/70 p-4 sm:p-6">
            <div className="glass w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">{ selectedCard.productName }</h2>
              <form
                onSubmit={ ( event ) => {
                  event.preventDefault();
                  handleAddToCollection();
                } }
                className="space-y-4"
              >
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-white/80">
                    Condition
                  </span>
                  <select
                    className="w-full rounded border p-2 text-black"
                    value={ modalVariant?.baseCondition || "" }
                    onChange={ ( event ) => updateModalVariant( { condition: event.target.value } ) }
                    required
                  >
                    { modalOptions.conditions.map( ( option ) => (
                      <option key={ option } value={ option }>
                        { option }
                      </option>
                    ) ) }
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-white/80">
                    Printing
                  </span>
                  <select
                    className="w-full rounded border p-2 text-black"
                    value={ modalVariant?.printing || "" }
                    onChange={ ( event ) => updateModalVariant( { printing: event.target.value } ) }
                    required
                  >
                    { modalOptions.printings.map( ( option ) => (
                      <option key={ option } value={ option }>
                        { option }
                      </option>
                    ) ) }
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-white/80">
                    Rarity
                  </span>
                  <select
                    className="w-full rounded border p-2 text-black"
                    value={ modalVariant?.rarity || "" }
                    onChange={ ( event ) => updateModalVariant( { rarity: event.target.value } ) }
                    required
                  >
                    { modalOptions.rarities.map( ( option ) => (
                      <option key={ option } value={ option }>
                        { option }
                      </option>
                    ) ) }
                  </select>
                </label>

                { modalVariant && (
                  <p className="text-sm text-white/80">
                    Current market price: { formatPriceLabel( modalVariant.marketPrice ) }
                  </p>
                ) }

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={ closeModal }
                    className="rounded bg-red-500 px-4 py-2 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-green-500 px-4 py-2 text-white"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) }

        { bulkModalVisible && (
          <div className="sticky inset-0 z-50 flex items-start justify-start bg-black/70 p-4 sm:p-6">
            <div className="glass w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">Add Selected Cards</h2>
              <form onSubmit={ handleBulkSubmit } className="space-y-6">
                { getSelectedCards().map( ( row ) => {
                  const cardEntry = cards.find( ( card ) => card.productName === row.card.productName );
                  const variants = cardEntry?.variants || [];
                  const selectedVariant = bulkSelections[ row.card.productName ] || row.variant || variants[ 0 ];
                  const selectedValue = selectedVariant ? variantKey( selectedVariant ) : "";

                  return (
                    <div key={ row.card.productName } className="border-b pb-4">
                      <h3 className="mb-2 font-semibold">{ row.card.productName }</h3>
                      { variants.length === 0 ? (
                        <p className="text-sm text-white/70">No pricing data available.</p>
                      ) : (
                        <label className="block">
                          <span className="mb-1 block text-sm font-semibold text-white/80">
                            Choose variant
                          </span>
                          <select
                            className="w-full rounded border p-2 text-black"
                            value={ selectedValue }
                            onChange={ ( event ) => {
                              const nextVariant = variants.find( ( variant ) => variantKey( variant ) === event.target.value ) || variants[ 0 ];
                              setBulkSelections( ( prev ) => ( {
                                ...prev,
                                [ row.card.productName ]: nextVariant,
                              } ) );
                            } }
                          >
                            { variants.map( ( variant ) => (
                              <option key={ variantKey( variant ) } value={ variantKey( variant ) }>
                                { `${ buildVariantLabel( variant ) } - ${ formatPriceLabel( variant.marketPrice ) }` }
                              </option>
                            ) ) }
                          </select>
                        </label>
                      ) }
                    </div>
                  );
                } ) }

                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={ closeBulkModal }
                    className="rounded bg-red-500 px-4 py-2 text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-green-500 px-4 py-2 text-white"
                  >
                    Add All
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) }
      </div>
      <SpeedInsights />
    </>
  );
};

export default CardsInSetPage;








