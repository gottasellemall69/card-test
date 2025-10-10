import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Grid, List } from "lucide-react";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import Card from "@/components/Yugioh/Card";
import CardFilter from "@/components/Yugioh/CardFilter";
import YugiohSearchBar from "@/components/Yugioh/YugiohSearchBar";
import YugiohCardDataTable from "@/components/Yugioh/YugiohCardDataTable";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import Notification from "@/components/Notification";
import { fetchCardData as fetchAllCardData } from "@/utils/api";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { buildCollectionKey, buildCollectionMap } from "@/utils/collectionUtils.js";

const DEFAULT_AUTO_CONDITION = "";
const DEFAULT_AUTO_PRINTING = "";

// Order matters: check "Unlimited" before "Limited" to avoid substring collisions
const PRINTING_TOKENS = [ "1st Edition", "Unlimited", "Limited" ];
const STANDARD_CONDITION_VALUES = [
  "Near Mint 1st Edition",
  "Lightly Played 1st Edition",
  "Moderately Played 1st Edition",
  "Heavily Played 1st Edition",
  "Damaged 1st Edition",
  "Near Mint Limited",
  "Lightly Played Limited",
  "Moderately Played Limited",
  "Heavily Played Limited",
  "Damaged Limited",
  "Near Mint Unlimited",
  "Lightly Played Unlimited",
  "Moderately Played Unlimited",
  "Heavily Played Unlimited",
  "Damaged Unlimited",
];
const GRID_ITEMS_PER_PAGE = 12;

const normalizeFilterToken = ( value = "" ) => {
  if ( value === null || value === undefined ) {
    return "";
  }

  return value.toString().toLowerCase().trim();
};

const canonicalizePrintingLabel = ( value = "" ) => {
  const normalized = normalizeFilterToken( value );

  if ( !normalized ) {
    return "";
  }

  if ( normalized.includes( "first" ) || normalized.includes( "1st" ) ) {
    return "1st Edition";
  }

  if ( normalized.includes( "unlimit" ) ) {
    return "Unlimited";
  }

  if ( normalized.includes( "limited" ) ) {
    return "Limited";
  }

  return value.toString().trim();
};

const buildConditionLabel = ( baseCondition = "", printing = "" ) => {
  const parts = [ baseCondition, printing ].filter( Boolean );
  return parts.join( " " ).trim();
};

const parseConditionFilterValue = ( value ) => {
  if ( typeof value !== "string" ) return null;

  const trimmedValue = value.trim();

  if ( !trimmedValue ) {
    return null;
  }

  const lowerValue = trimmedValue.toLowerCase();
  let baseCondition = trimmedValue;
  let printing = null;

  for ( const token of PRINTING_TOKENS ) {
    const tokenLower = token.toLowerCase();
    if ( lowerValue.endsWith( tokenLower ) ) {
      const potentialBase = trimmedValue.slice( 0, trimmedValue.length - token.length ).trim();
      if ( potentialBase ) {
        baseCondition = potentialBase;
        printing = token;
      }
      break;
    }
  }

  return {
    raw: trimmedValue,
    baseCondition,
    printing,
    normalizedBase: normalizeFilterToken( baseCondition ),
    normalizedPrinting: printing ? normalizeFilterToken( printing ) : null,
  };
};

const resolveConditionDetails = ( rawCondition, rawPrinting ) => {
  const condition = typeof rawCondition === "string" ? rawCondition.trim() : "";
  const printing = canonicalizePrintingLabel( rawPrinting );

  const parsed = parseConditionFilterValue( condition );

  let baseCondition = parsed?.baseCondition?.trim() || condition;
  let printingLabel = canonicalizePrintingLabel( printing || parsed?.printing );

  if ( !printingLabel && condition ) {
    const lowerCondition = normalizeFilterToken( condition );
    for ( const token of PRINTING_TOKENS ) {
      const tokenLower = normalizeFilterToken( token );
      if ( lowerCondition.endsWith( tokenLower ) ) {
        const potentialBase = condition.slice( 0, condition.length - token.length ).trim();
        if ( potentialBase ) {
          baseCondition = potentialBase;
          printingLabel = token;
        }
        break;
      }
    }
  }

  if ( !baseCondition && condition ) {
    baseCondition = condition;
  }

  const conditionLabel = buildConditionLabel( baseCondition, printingLabel );

  return {
    baseCondition,
    printing: printingLabel,
    conditionLabel,
  };
};

const ensureAllConditionVariants = ( variants = [], { productId = null, productName = "", cardMeta = null } = {} ) => {
  const baseVariant = variants[ 0 ] || {};
  const defaultProductId = baseVariant.productID ?? productId ?? null;
  const defaultNumber = baseVariant.number || "";
  const defaultRarity = baseVariant.rarity || "Unknown Rarity";
  const defaultSet = baseVariant.set || cardMeta?.set_name || null;

  const normalizedVariants = variants.map( ( variant ) => {
    const conditionLabel =
      variant.conditionLabel || buildConditionLabel( variant.baseCondition, variant.printing );
    return {
      ...variant,
      productID: variant.productID ?? defaultProductId,
      productName: variant.productName || productName,
      conditionLabel,
      condition: conditionLabel || variant.condition || "",
    };
  } );

  const existingConditionTokens = new Set(
    normalizedVariants
      .map( ( variant ) => normalizeFilterToken( variant.conditionLabel ) )
      .filter( Boolean )
  );

  STANDARD_CONDITION_VALUES.forEach( ( conditionValue ) => {
    const { baseCondition, printing, conditionLabel } = resolveConditionDetails( conditionValue );
    const token = normalizeFilterToken( conditionLabel );
    if ( !conditionLabel || existingConditionTokens.has( token ) ) {
      return;
    }

    normalizedVariants.push( {
      productID: defaultProductId,
      productName,
      number: defaultNumber,
      rarity: defaultRarity,
      set: defaultSet,
      baseCondition,
      printing,
      conditionLabel,
      condition: conditionLabel,
      marketPrice: 0,
      lowPrice: 0,
    } );
    existingConditionTokens.add( token );
  } );

  return normalizedVariants;
};

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
  const left = ( a ?? "" ).toString();
  const right = ( b ?? "" ).toString();
  return left.localeCompare( right, undefined, { numeric: true, sensitivity: "base" } );
};

const formatPriceLabel = ( value ) => {
  const numeric = Number( value );
  if ( Number.isFinite( numeric ) ) {
    return "$" + numeric.toFixed( 2 );
  }
  return "n/a";
};

const normalizeRarity = ( rarity ) => rarity || "Unknown Rarity";
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
  const conditionPart =
    variant.conditionLabel ||
    buildConditionLabel( variant.baseCondition, variant.printing ) ||
    "Unknown Condition";
  const rarityPart = variant.rarity || "Unknown Rarity";

  return [ conditionPart, rarityPart ].join( " - " );
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
    const { baseCondition, printing: resolvedPrinting, conditionLabel } = resolveConditionDetails(
      entry.condition,
      entry.printing
    );
    const variant = {
      ...entry,
      baseCondition,
      printing: resolvedPrinting,
      conditionLabel: conditionLabel || entry.condition || "",
      condition: conditionLabel || entry.condition || "",
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
      const productId = card.productId || card.cardMeta?.id || null;
      const augmentedVariants = ensureAllConditionVariants( card.variants, {
        productId,
        productName: card.productName,
        cardMeta: card.cardMeta,
      } );
      const sortedVariants = [ ...augmentedVariants ].sort( ( a, b ) => {
        const printingCompare = safeCompare( a.printing, b.printing );
        if ( printingCompare !== 0 ) return printingCompare;

        const conditionCompare = safeCompare( a.baseCondition, b.baseCondition );
        if ( conditionCompare !== 0 ) return conditionCompare;

        return safeCompare( a.rarity, b.rarity );
      } );

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
  const [ filters, setFilters ] = useState( { rarity: [], condition: [], printing: [] } );
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
  const [ sortField, setSortField ] = useState( "productName" );
  const [ sortDirection, setSortDirection ] = useState( "asc" );
  const [ viewMode, setViewMode ] = useState( "grid" );
  const [ gridPage, setGridPage ] = useState( 1 );
  const [ isClient, setIsClient ] = useState( false );
  const [ isFilterDrawerOpen, setIsFilterDrawerOpen ] = useState( false );

  const selectedConditions = filters.condition;
  const selectedPrintings = filters.printing;
  const selectedRarities = filters.rarity;

  const conditionDescriptors = useMemo(
    () =>
      selectedConditions
        .map( parseConditionFilterValue )
        .filter( ( descriptor ) => descriptor && descriptor.normalizedBase ),
    [ selectedConditions ]
  );

  const normalizedRarityFilters = useMemo(
    () => selectedRarities.map( ( value ) => normalizeRarity( value ) ),
    [ selectedRarities ]
  );

  const primaryCondition = conditionDescriptors[ 0 ]?.baseCondition || DEFAULT_AUTO_CONDITION;
  const primaryPrinting =
    selectedPrintings[ 0 ] ||
    conditionDescriptors.find( ( descriptor ) => Boolean( descriptor.printing ) )?.printing ||
    DEFAULT_AUTO_PRINTING;
  const primaryRarity = normalizedRarityFilters[ 0 ] || null;
  const activeFilterCount =
    selectedConditions.length + selectedPrintings.length + selectedRarities.length;
  const hasActiveFilters = activeFilterCount > 0;

  const handleFilterChange = useCallback( ( filterType, values ) => {
    setFilters( ( prev ) => ( {
      ...prev,
      [ filterType ]: Array.isArray( values ) ? values : prev[ filterType ],
    } ) );
  }, [] );

  const removeFilterValue = useCallback( ( filterType, value ) => {
    setFilters( ( prev ) => ( {
      ...prev,
      [ filterType ]: ( prev[ filterType ] || [] ).filter( ( entry ) => entry !== value ),
    } ) );
  }, [] );

  const clearFilters = useCallback( () => {
    setFilters( { rarity: [], condition: [], printing: [] } );
  }, [] );
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

  const preferences = useMemo( () => ( {
    condition: primaryCondition,
    printing: primaryPrinting,
    rarity: primaryRarity,
  } ), [ primaryCondition, primaryPrinting, primaryRarity ] );
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
          setFilters( { rarity: [], condition: [], printing: [] } );
          setRarityOverrides( {} );
          setGridSelectionMode( false );
          setGridPage( 1 );
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
    setGridPage( 1 );
  }, [ selectedConditions, selectedPrintings, selectedRarities, rarityOverrides ] );

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

    const printingFilterSet = new Set(
      selectedPrintings
        .map( ( value ) => normalizeFilterToken( value ) )
        .filter( ( value ) => Boolean( value ) )
    );
    const rarityFilterSet = new Set(
      normalizedRarityFilters
        .map( ( value ) => normalizeFilterToken( value ) )
        .filter( ( value ) => Boolean( value ) )
    );

    const hasActiveVariantFilters =
      conditionDescriptors.length > 0 ||
      printingFilterSet.size > 0 ||
      rarityFilterSet.size > 0;

    const variantMatchesFilters = ( variant, activeRaritySet = rarityFilterSet ) => {
      const rarityValue = normalizeFilterToken( normalizeRarity( variant.rarity ) );
      const conditionValue = normalizeFilterToken( variant.baseCondition );
      const printingValue = normalizeFilterToken( variant.printing );

      const rarityMatches =
        activeRaritySet.size === 0 || activeRaritySet.has( rarityValue );

      const conditionMatches =
        conditionDescriptors.length === 0 ||
        conditionDescriptors.some( ( descriptor ) => {
          if ( !descriptor.normalizedBase ) {
            return false;
          }
          if ( descriptor.normalizedBase !== conditionValue ) {
            return false;
          }
          if ( descriptor.normalizedPrinting ) {
            return descriptor.normalizedPrinting === printingValue;
          }
          return true;
        } );

      const printingMatches =
        printingFilterSet.size === 0 || printingFilterSet.has( printingValue );

      return rarityMatches && conditionMatches && printingMatches;
    };

    if ( hasActiveVariantFilters ) {
      data = data.filter( ( card ) =>
        card.variants.some( ( variant ) => variantMatchesFilters( variant ) )
      );
    }

    const baseSelectionLabelParts = [];
    if ( selectedConditions.length > 0 ) {
      baseSelectionLabelParts.push( selectedConditions.join( ", " ) );
    }
    if ( selectedPrintings.length > 0 ) {
      baseSelectionLabelParts.push( selectedPrintings.join( ", " ) );
    }
    const raritySelectionLabel =
      selectedRarities.length > 0 ? selectedRarities.join( ", " ) : null;

    const enrichedCards = data
      .map( ( card ) => {
        const primaryImageId = card.cardMeta?.card_images?.[ 0 ]?.id || null;
        const remoteImageUrl = card.cardMeta?.card_images?.[ 0 ]?.image_url || null;
        const overrideKey = makeOverrideKey( card.productName );
        const forcedRarity = rarityOverrides[ overrideKey ];
        const normalizedForcedRarity = forcedRarity ? normalizeRarity( forcedRarity ) : null;
        const forcedRarityToken = normalizedForcedRarity
          ? normalizeFilterToken( normalizedForcedRarity )
          : null;
        const activeRaritySet = forcedRarityToken
          ? new Set( [ forcedRarityToken ] )
          : rarityFilterSet;
        const desiredRarity = normalizedForcedRarity || preferences.rarity || null;

        const raritySet = new Set();
        card.variants.forEach( ( variant ) => {
          raritySet.add( normalizeRarity( variant.rarity ) );
        } );
        const rarityOptions = Array.from( raritySet ).sort( ( a, b ) => safeCompare( a, b ) );
        const hasMultipleRarities = rarityOptions.length > 1;

        const variants = card.variants || [];
        const exactVariant = variants.find( ( variant ) =>
          variantMatchesFilters( variant, activeRaritySet )
        );

        let fallbackVariant = exactVariant;

        if ( !fallbackVariant && normalizedForcedRarity ) {
          fallbackVariant = variants.find(
            ( variant ) => normalizeRarity( variant.rarity ) === normalizedForcedRarity
          );
        }

        if ( !fallbackVariant ) {
          fallbackVariant = variants.find( ( variant ) => {
            const printingValue = normalizeFilterToken( variant.printing );
            const printingMatches =
              printingFilterSet.size === 0 || printingFilterSet.has( printingValue );

            if ( !printingMatches ) {
              return false;
            }

            if ( conditionDescriptors.length === 0 ) {
              return true;
            }

            const variantCondition = normalizeFilterToken( variant.baseCondition );

            return conditionDescriptors.some( ( descriptor ) => {
              if ( descriptor.normalizedBase !== variantCondition ) {
                return false;
              }
              if ( descriptor.normalizedPrinting ) {
                return descriptor.normalizedPrinting === printingValue;
              }
              return true;
            } );
          } );
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
            baseCondition: primaryCondition || templateVariant.baseCondition || "",
            printing: primaryPrinting || templateVariant.printing || "",
            conditionLabel: buildConditionLabel(
              primaryCondition || templateVariant.baseCondition || "",
              primaryPrinting || templateVariant.printing || ""
            ),
            rarity: desiredRarity || normalizeRarity( templateVariant.rarity ),
            marketPrice: null,
            lowPrice: null,
          };

        if ( !activeVariant.conditionLabel ) {
          activeVariant.conditionLabel = buildConditionLabel(
            activeVariant.baseCondition,
            activeVariant.printing
          );
        }

        if ( !exactVariant && desiredRarity && normalizeRarity( activeVariant.rarity ) !== desiredRarity ) {
          activeVariant.rarity = desiredRarity;
        }

        if ( !exactVariant ) {
          if ( primaryCondition ) {
            activeVariant.baseCondition = primaryCondition;
          }
          if ( primaryPrinting ) {
            activeVariant.printing = primaryPrinting;
          }
          activeVariant.conditionLabel = buildConditionLabel(
            activeVariant.baseCondition,
            activeVariant.printing
          );
          activeVariant.marketPrice = null;
          activeVariant.lowPrice = null;
        }

        const selectionParts = [ ...baseSelectionLabelParts ];
        if ( normalizedForcedRarity ) {
          selectionParts.push( normalizedForcedRarity );
        } else if ( raritySelectionLabel ) {
          selectionParts.push( raritySelectionLabel );
        }
        const selectionLabel = selectionParts.join( " / " );
        const selectionMissing = selectionParts.length > 0 && !exactVariant;

        const selectedRarity = normalizeRarity( activeVariant.rarity );
        const selectedRarityOption = forcedRarity || AUTO_RARITY_OPTION;

        const collectionKey = makeCollectionKey( card.productName, activeVariant );
        const cardDetailId =
          card.cardMeta?.id ||
          primaryImageId ||
          card.productId ||
          templateVariant?.productID ||
          null;

        const cardImageId = primaryImageId || cardDetailId;
        const cardNumber = activeVariant?.number || templateVariant?.number || variants[ 0 ]?.number || "";
        const setLabel = activeVariant?.set || templateVariant?.set || card.cardMeta?.set_name || activeSetDisplayName;

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
          cardNumber,
          setLabel,
        };
      } )
      .filter( Boolean );

    const getSortValue = ( card ) => {
      switch ( sortField ) {
        case "setName":
          return card.setLabel || activeSetDisplayName || "";
        case "number":
          return card.cardNumber || "";
        case "rarity":
          return normalizeRarity( card.activeVariant?.rarity );
        case "condition":
          return card.activeVariant?.baseCondition || "";
        case "printing":
          return card.activeVariant?.printing || "";
        case "marketPrice":
          return card.activeVariant?.marketPrice ?? null;
        case "productName":
        default:
          return card.productName || "";
      }
    };

    const sortedCards = [ ...enrichedCards ].sort( ( left, right ) => {
      const leftValue = getSortValue( left );
      const rightValue = getSortValue( right );

      if ( leftValue == null && rightValue == null ) {
        return 0;
      }

      if ( leftValue == null ) {
        return sortDirection === "asc" ? 1 : -1;
      }

      if ( rightValue == null ) {
        return sortDirection === "asc" ? -1 : 1;
      }

      const leftNumber = Number( leftValue );
      const rightNumber = Number( rightValue );

      if ( Number.isFinite( leftNumber ) && Number.isFinite( rightNumber ) ) {
        return sortDirection === "asc"
          ? leftNumber - rightNumber
          : rightNumber - leftNumber;
      }

      const leftLabel = leftValue.toString().toLowerCase();
      const rightLabel = rightValue.toString().toLowerCase();

      const comparison = leftLabel.localeCompare( rightLabel, undefined, {
        numeric: true,
        sensitivity: "base",
      } );

      if ( comparison !== 0 ) {
        return sortDirection === "asc" ? comparison : -comparison;
      }

      return left.productName.localeCompare( right.productName, undefined, {
        numeric: true,
        sensitivity: "base",
      } );
    } );

    return sortedCards;
  }, [
    cards,
    searchTerm,
    selectedNumbers,
    selectedConditions,
    selectedPrintings,
    selectedRarities,
    conditionDescriptors,
    normalizedRarityFilters,
    primaryCondition,
    primaryPrinting,
    preferences,
    sortField,
    sortDirection,
    makeCollectionKey,
    rarityOverrides,
    makeOverrideKey,
    activeSetDisplayName,
  ] );
  const gridTotalPages = Math.max(
    1,
    Math.ceil( ( processedCards.length || 0 ) / GRID_ITEMS_PER_PAGE )
  );
  const safeGridPage = Math.min( Math.max( gridPage, 1 ), gridTotalPages );
  const paginatedGridCards = useMemo( () => {
    if ( viewMode !== "grid" ) {
      return processedCards;
    }
    const startIndex = ( safeGridPage - 1 ) * GRID_ITEMS_PER_PAGE;
    return processedCards.slice( startIndex, startIndex + GRID_ITEMS_PER_PAGE );
  }, [ processedCards, viewMode, safeGridPage ] );

  const handleGridPageChange = useCallback(
    ( page ) => {
      if ( viewMode !== "grid" ) return;
      const clamped = Math.min( Math.max( page, 1 ), gridTotalPages );
      setGridPage( clamped );
    },
    [ gridTotalPages, viewMode ]
  );

  useEffect( () => {
    if ( viewMode !== "grid" ) return;
    setGridPage( ( prev ) => {
      const clamped = Math.min( Math.max( prev, 1 ), gridTotalPages );
      return clamped === prev ? prev : clamped;
    } );
  }, [ gridTotalPages, viewMode ] );

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
      const conditionLabel =
        variant?.conditionLabel ||
        buildConditionLabel( variant?.baseCondition, variant?.printing ) ||
        "Unknown Condition";

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
        cardDetailId: card.cardDetailId,
        setLabel: card.setLabel,
        detailParams: {
          cardId: card.cardDetailId,
          cardName: card.productName,
          setName: card.setLabel || activeSetDisplayName,
          setCode: variant?.number || "",
          rarity: variant?.rarity || "Unknown Rarity",
          setRarity: variant?.rarity || "Unknown Rarity",
          edition: variant?.printing || "Unknown Edition",
        },
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
              cardId:
                selectedCard.cardDetailId ||
                modalVariant.productID ||
                modalVariant.id ||
                null,
              productName: selectedCard.productName,
              setName: modalVariant.set || activeSetDisplayName,
              number: modalVariant.number || "",
              printing: modalVariant.printing || "Unknown Edition",
              rarity: modalVariant.rarity || "Unknown Rarity",
              condition:
                modalVariant.conditionLabel ||
                buildConditionLabel( modalVariant.baseCondition, modalVariant.printing ) ||
                "Unknown Condition",
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
          cardId:
            row.cardDetailId ||
            variant.productID ||
            row.variant?.productID ||
            row.card?.cardDetailId ||
            null,
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
      <Head>
        <title>Yu-Gi-Oh! Set Contents</title>
        <meta name="description" content={ `Explore ${ processedCards.length || 0 } card listings with live pricing and quick filters.` } />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
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
                <div className="md:col-span-3 lg:col-span-3 flex flex-col gap-4 text-sm text-white/80">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <CardFilter
                        filters={ filters }
                        updateFilters={ handleFilterChange }
                        open={ isFilterDrawerOpen }
                        setOpen={ setIsFilterDrawerOpen }
                      />
                      { hasActiveFilters && (
                        <button
                          type="button"
                          onClick={ () => {
                            clearFilters();
                            setIsFilterDrawerOpen( false );
                          } }
                          className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white"
                        >
                          Clear Filters
                        </button>
                      ) }
                      { hasActiveFilters && (
                        <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-indigo-100/90">
                          { activeFilterCount } active
                        </span>
                      ) }
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white/70">Sort</span>
                      <select
                        value={ sortField }
                        onChange={ ( event ) => setSortField( event.target.value ) }
                        className="rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-medium text-white/80 shadow-sm transition hover:border-white/40 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                      >
                        <option value="productName">Card Name</option>
                        <option value="setName">Set Name</option>
                        <option value="number">Card Number</option>
                        <option value="rarity">Card Rarity</option>
                        <option value="condition">Condition</option>
                        <option value="printing">Printing</option>
                        <option value="marketPrice">Market Price</option>
                      </select>
                      <button
                        type="button"
                        onClick={ () => setSortDirection( ( prev ) => ( prev === "asc" ? "desc" : "asc" ) ) }
                        className="inline-flex items-center rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40 hover:text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                      >
                        { sortDirection === "asc" ? "Asc" : "Desc" }
                      </button>
                    </div>
                  </div>

                  { hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 text-sm text-white/80">
                      { selectedConditions.map( ( value ) => (
                        <span
                          key={ `condition-${ value }` }
                          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 shadow-sm"
                        >
                          <span className="text-white/60">Condition:</span> { value }
                          <button
                            type="button"
                            onClick={ () => removeFilterValue( "condition", value ) }
                            className="text-xs text-red-300 transition hover:text-red-200"
                          >
                            x
                          </button>
                        </span>
                      ) ) }
                      { selectedPrintings.map( ( value ) => (
                        <span
                          key={ `printing-${ value }` }
                          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 shadow-sm"
                        >
                          <span className="text-white/60">Printing:</span> { value }
                          <button
                            type="button"
                            onClick={ () => removeFilterValue( "printing", value ) }
                            className="text-xs text-red-300 transition hover:text-red-200"
                          >
                            x
                          </button>
                        </span>
                      ) ) }
                      { selectedRarities.map( ( value ) => (
                        <span
                          key={ `rarity-${ value }` }
                          className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/80 shadow-sm"
                        >
                          <span className="text-white/60">Rarity:</span> { value }
                          <button
                            type="button"
                            onClick={ () => removeFilterValue( "rarity", value ) }
                            className="text-xs text-red-300 transition hover:text-red-200"
                          >
                            x
                          </button>
                        </span>
                      ) ) }
                    </div>
                  ) }
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
              <>
                <div className="w-auto overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl">
                  <div className=" grid grid-cols-1 border-l border-white/5 sm:mx-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    { paginatedGridCards.map( ( cardItem ) => renderGridCard( cardItem ) ) }
                  </div>
                </div>
                { gridTotalPages > 1 && (
                  <YugiohPagination
                    currentPage={ safeGridPage }
                    itemsPerPage={ GRID_ITEMS_PER_PAGE }
                    totalItems={ processedCards.length }
                    handlePageClick={ handleGridPageChange }
                  />
                ) }
              </>
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












