import fs from "fs/promises";
import path from "path";
import { getCardData, getSetNameIdMap } from "@/utils/api.js";

const BATCH_SIZE = 4;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 30;
const MAX_CACHEABLE_RESULTS = 5000;
const YGO_CARD_SEARCH_ENDPOINT =
  "https://db.ygoprodeck.com/api/v7/cardinfo.php";
const CARD_SETS_PATH = path.join(
  process.cwd(),
  "public",
  "card-data",
  "Yugioh",
  "card_sets.json"
);

let cachedSetAbbreviationMap = null;
const searchResultCache = new Map();

const normalizeText = ( value ) => ( value ?? "" ).toString().toLowerCase();
const toSearchText = ( value ) =>
  normalizeText( value ).replace( /[^a-z0-9]+/g, " " ).trim();
const toCompactText = ( value ) =>
  normalizeText( value ).replace( /[^a-z0-9]+/g, "" );

const tokenizeQuery = ( query ) =>
  toSearchText( query )
    .split( /\s+/ )
    .filter( Boolean );

const buildHaystack = ( card ) => {
  const joined = [
    card?.productName,
    card?.setName,
    card?.set,
    card?.number,
    card?.printing,
    card?.rarity,
    card?.condition,
  ]
    .filter( Boolean )
    .join( " " );

  return {
    normalized: toSearchText( joined ),
    compact: toCompactText( joined ),
  };
};

const matchesTokens = ( haystack, tokens, compactQuery ) => {
  if ( tokens.length === 0 ) {
    return false;
  }

  const allTokensMatch = tokens.every(
    ( token ) =>
      haystack.normalized.includes( token ) ||
      haystack.compact.includes( token )
  );

  if ( allTokensMatch ) {
    return true;
  }

  if ( compactQuery && haystack.compact.includes( compactQuery ) ) {
    return true;
  }

  return false;
};

const extractCardResults = ( payload ) => {
  if ( Array.isArray( payload ) ) {
    return payload;
  }

  if ( Array.isArray( payload?.result ) ) {
    return payload.result;
  }

  return [];
};

const buildResultRow = ( card ) => ( {
  productName: card?.productName ?? "",
  setName: card?.set ?? card?.setName ?? "",
  number: card?.number ?? "",
  printing: card?.printing ?? "",
  rarity: card?.rarity ?? "",
  condition: card?.condition ?? "",
  marketPrice: card?.marketPrice ?? "0.00",
  lowPrice: card?.lowPrice ?? "0.00",
} );

const buildDedupKey = ( row ) =>
  [
    row.productName,
    row.setName,
    row.number,
    row.printing,
    row.rarity,
    row.condition,
  ].join( "|" );

const CONDITION_ORDER = [
  "near mint",
  "lightly played",
  "moderately played",
  "heavily played",
  "damaged",
];

const getConditionRank = ( value ) => {
  const normalized = normalizeText( value );
  const matchIndex = CONDITION_ORDER.findIndex( ( label ) =>
    normalized.startsWith( label )
  );
  return matchIndex === -1 ? CONDITION_ORDER.length : matchIndex;
};

const sortConditionEntries = ( entries ) =>
  [ ...entries ].sort( ( a, b ) => {
    const rankA = getConditionRank( a?.condition );
    const rankB = getConditionRank( b?.condition );
    if ( rankA !== rankB ) return rankA - rankB;
    const aText = normalizeText( a?.condition );
    const bText = normalizeText( b?.condition );
    if ( aText < bText ) return -1;
    if ( aText > bText ) return 1;
    const aPrice = parseFloat( a?.marketPrice ) || 0;
    const bPrice = parseFloat( b?.marketPrice ) || 0;
    return bPrice - aPrice;
  } );

const buildGroupKey = ( row ) =>
  [ row.productName, row.setName, row.number, row.printing, row.rarity ].join(
    "|"
  );

const finalizeGroupRow = ( group ) => {
  const sortedConditions = sortConditionEntries( group.conditions || [] );
  const primary = sortedConditions[ 0 ] || {};
  return {
    productName: group.productName ?? "",
    setName: group.setName ?? "",
    number: group.number ?? "",
    printing: group.printing ?? "",
    rarity: group.rarity ?? "",
    condition: primary.condition ?? "",
    marketPrice: primary.marketPrice ?? "0.00",
    lowPrice: primary.lowPrice ?? "0.00",
    conditions: sortedConditions,
  };
};

const DEFAULT_SORT_KEY = "productName";
const SORTABLE_KEYS = new Set( [
  "productName",
  "setName",
  "number",
  "printing",
  "rarity",
  "condition",
  "marketPrice",
] );

const parseSortKey = ( value ) => {
  if ( typeof value !== "string" ) {
    return DEFAULT_SORT_KEY;
  }
  return SORTABLE_KEYS.has( value ) ? value : DEFAULT_SORT_KEY;
};

const parseSortDirection = ( value ) =>
  value === "descending" || value === "desc" ? "descending" : "ascending";

const sortRows = ( items, sortKey, direction ) => {
  const isPriceSort = sortKey === "marketPrice";
  const multiplier = direction === "ascending" ? 1 : -1;

  return [ ...items ].sort( ( a, b ) => {
    const rawA = a?.[ sortKey ];
    const rawB = b?.[ sortKey ];
    const aValue = isPriceSort ? parseFloat( rawA ) || 0 : ( rawA ?? "" ).toString().toLowerCase();
    const bValue = isPriceSort ? parseFloat( rawB ) || 0 : ( rawB ?? "" ).toString().toLowerCase();

    if ( aValue < bValue ) return -1 * multiplier;
    if ( aValue > bValue ) return 1 * multiplier;
    return 0;
  } );
};

const loadSetAbbreviationMap = async () => {
  if ( cachedSetAbbreviationMap ) {
    return cachedSetAbbreviationMap;
  }

  try {
    const fileContents = await fs.readFile( CARD_SETS_PATH, "utf8" );
    const parsed = JSON.parse( fileContents );
    const entries = Array.isArray( parsed ) ? parsed : [];
    const map = new Map();

    entries.forEach( ( setEntry ) => {
      const abbreviation = setEntry?.abbreviation;
      const setName = setEntry?.name || setEntry?.cleanSetName;
      if ( !abbreviation || !setName ) {
        return;
      }

      map.set( abbreviation.toUpperCase(), setName );
    } );

    cachedSetAbbreviationMap = map;
  } catch ( error ) {
    console.error( "Failed to load set abbreviations:", error );
    cachedSetAbbreviationMap = new Map();
  }

  return cachedSetAbbreviationMap;
};

const extractSetCodeHints = ( query, abbreviationMap ) => {
  const upper = ( query ?? "" ).toString().toUpperCase();
  const fullCodeMatch = upper.match( /[A-Z0-9]{2,5}-[A-Z]{2}\d{1,3}/ );
  const prefixFromFull = fullCodeMatch ? fullCodeMatch[ 0 ].split( "-" )[ 0 ] : "";
  const tokens = upper.split( /[^A-Z0-9]+/ ).filter( Boolean );
  const abbreviations = new Set();

  tokens.forEach( ( token ) => {
    if ( abbreviationMap.has( token ) ) {
      abbreviations.add( token );
    }
  } );

  if ( prefixFromFull && abbreviationMap.has( prefixFromFull ) ) {
    abbreviations.add( prefixFromFull );
  }

  return {
    fullCode: fullCodeMatch ? fullCodeMatch[ 0 ] : "",
    abbreviations: Array.from( abbreviations ),
  };
};

const buildCacheKey = ( query ) => toSearchText( query );

const readCacheEntry = ( cacheKey ) => {
  const entry = searchResultCache.get( cacheKey );
  if ( !entry ) {
    return null;
  }

  if ( Date.now() - entry.createdAt > CACHE_TTL_MS ) {
    searchResultCache.delete( cacheKey );
    return null;
  }

  searchResultCache.delete( cacheKey );
  searchResultCache.set( cacheKey, entry );
  return entry;
};

const writeCacheEntry = ( cacheKey, entry ) => {
  searchResultCache.set( cacheKey, entry );

  if ( searchResultCache.size <= MAX_CACHE_ENTRIES ) {
    return;
  }

  const oldestKey = searchResultCache.keys().next().value;
  if ( oldestKey ) {
    searchResultCache.delete( oldestKey );
  }
};

const fetchYgoMatches = async ( query ) => {
  const url = `${ YGO_CARD_SEARCH_ENDPOINT }?fname=${ encodeURIComponent(
    query
  ) }&tcgplayer_data=true`;
  const response = await fetch( url );
  const data = await response.json();
  return Array.isArray( data?.data ) ? data.data : [];
};

const buildSetNameLookup = ( setNameIdMap ) => {
  const lookup = new Map();
  Object.keys( setNameIdMap ).forEach( ( setName ) => {
    if ( setName ) {
      lookup.set( setName.toLowerCase(), setName );
    }
  } );
  return lookup;
};

const collectCandidateSetsFromYgo = ( matches, setNameLookup, setCodeHint ) => {
  const candidates = new Set();
  const codeHint = setCodeHint ? setCodeHint.toLowerCase() : "";

  matches.forEach( ( card ) => {
    const sets = Array.isArray( card?.card_sets ) ? card.card_sets : [];
    sets.forEach( ( set ) => {
      const setName = set?.set_name;
      if ( !setName ) {
        return;
      }

      if ( codeHint ) {
        const setCode = ( set?.set_code ?? "" ).toLowerCase();
        if ( setCode && !setCode.includes( codeHint ) ) {
          return;
        }
      }

      const canonicalName = setNameLookup.get( setName.toLowerCase() );
      if ( canonicalName ) {
        candidates.add( canonicalName );
      }
    } );
  } );

  return Array.from( candidates );
};

const findCandidateSets = ( entries, query ) => {
  const normalizedQuery = toSearchText( query );
  if ( normalizedQuery.length < 5 ) {
    return [];
  }

  return entries.filter( ( [ setName ] ) => {
    const normalizedSetName = toSearchText( setName );
    if ( !normalizedSetName ) {
      return false;
    }

    return (
      normalizedQuery.includes( normalizedSetName ) ||
      normalizedSetName.includes( normalizedQuery )
    );
  } );
};

export default async function handler( req, res ) {
  if ( req.method !== "GET" ) {
    res.setHeader( "Allow", [ "GET" ] );
    return res.status( 405 ).json( { message: "Method not allowed" } );
  }

  const rawQuery = req.query.q ?? req.query.query ?? "";
  const query = Array.isArray( rawQuery ) ? rawQuery[ 0 ] : rawQuery;
  const searchQuery = query ? query.toString().trim() : "";

  if ( !searchQuery ) {
    return res.status( 400 ).json( { message: "Search query is required" } );
  }

  const tokens = tokenizeQuery( searchQuery );
  const compactQuery = toCompactText( searchQuery );

  if ( tokens.length === 0 && !compactQuery ) {
    return res.status( 400 ).json( { message: "Search query is required" } );
  }

  try {
    const pageParam = Number.parseInt( req.query.page, 10 );
    const pageSizeParam = Number.parseInt( req.query.pageSize, 10 );
    const page = Number.isFinite( pageParam ) && pageParam > 0 ? pageParam : 1;
    const pageSize =
      Number.isFinite( pageSizeParam ) && pageSizeParam > 0
        ? Math.min( pageSizeParam, MAX_PAGE_SIZE )
        : DEFAULT_PAGE_SIZE;
    const offset = ( page - 1 ) * pageSize;
    const sortKey = parseSortKey( req.query.sortKey );
    const sortDirection = parseSortDirection( req.query.sortDirection );
    const cacheKey = `${ buildCacheKey( searchQuery ) }::${ sortKey }::${ sortDirection }`;

    const cached = readCacheEntry( cacheKey );
    if ( cached ) {
      const pagedResults = cached.results.slice( offset, offset + pageSize );
      return res.status( 200 ).json( {
        query: searchQuery,
        results: pagedResults,
        totalCount: cached.totalCount,
        page,
        pageSize,
        sortKey,
        sortDirection,
        searchedSetCount: cached.searchedSetCount,
        usedSetFilter: cached.usedSetFilter,
        cacheHit: true,
      } );
    }

    const setNameIdMap = await getSetNameIdMap();

    if ( !setNameIdMap ) {
      return res.status( 500 ).json( { message: "Set catalogue unavailable." } );
    }

    const entries = Object.entries( setNameIdMap );
    const setNameLookup = buildSetNameLookup( setNameIdMap );
    const abbreviationMap = await loadSetAbbreviationMap();
    const codeHints = extractSetCodeHints( searchQuery, abbreviationMap );
    const candidateSetNames = new Set();

    codeHints.abbreviations.forEach( ( abbreviation ) => {
      const setName = abbreviationMap.get( abbreviation );
      if ( setName ) {
        candidateSetNames.add( setName );
      }
    } );

    if ( candidateSetNames.size === 0 ) {
      try {
        const ygoMatches = await fetchYgoMatches( searchQuery );
        const ygoCandidates = collectCandidateSetsFromYgo(
          ygoMatches,
          setNameLookup,
          codeHints.fullCode
        );
        ygoCandidates.forEach( ( setName ) => candidateSetNames.add( setName ) );
      } catch ( error ) {
        console.warn( "YGOProDeck search unavailable:", error );
      }
    }

    if ( candidateSetNames.size === 0 ) {
      const nameMatches = findCandidateSets( entries, searchQuery ).map(
        ( [ setName ] ) => setName
      );
      nameMatches.forEach( ( setName ) => candidateSetNames.add( setName ) );
    }

    const setsToSearch = Array.from( candidateSetNames ).sort( ( a, b ) =>
      a.localeCompare( b, undefined, { sensitivity: "base" } )
    );

    if ( setsToSearch.length === 0 ) {
      return res.status( 404 ).json( {
        message:
          "No candidate sets found. Add a set name, set code, or refine the card name.",
      } );
    }

    const results = [];
    let canCache = true;
    const grouped = new Map();
    const seen = new Set();

    for ( let i = 0; i < setsToSearch.length; i += BATCH_SIZE ) {
      const batch = setsToSearch.slice( i, i + BATCH_SIZE );
      await Promise.all(
        batch.map( async ( setName ) => {
          const payload = await getCardData( setName );
          const cards = extractCardResults( payload );

          for ( const card of cards ) {
            const haystack = buildHaystack( card );
            if ( !matchesTokens( haystack, tokens, compactQuery ) ) {
              continue;
            }

            const row = buildResultRow( card );
            const key = buildDedupKey( row );
            if ( seen.has( key ) ) {
              continue;
            }

            seen.add( key );
            const groupKey = buildGroupKey( row );
            let group = grouped.get( groupKey );
            if ( !group ) {
              group = {
                productName: row.productName,
                setName: row.setName,
                number: row.number,
                printing: row.printing,
                rarity: row.rarity,
                conditions: [],
              };
              grouped.set( groupKey, group );
              if ( grouped.size > MAX_CACHEABLE_RESULTS ) {
                canCache = false;
              }
            }

            group.conditions.push( {
              condition: row.condition,
              marketPrice: row.marketPrice,
              lowPrice: row.lowPrice,
            } );

          }
        } )
      );
    }

    grouped.forEach( ( group ) => {
      results.push( finalizeGroupRow( group ) );
    } );

    const totalCount = results.length;

    if ( canCache ) {
      const sortedCache = sortRows( results, sortKey, sortDirection );
      writeCacheEntry( cacheKey, {
        createdAt: Date.now(),
        results: sortedCache,
        totalCount,
        searchedSetCount: setsToSearch.length,
        usedSetFilter: true,
      } );
    }

    const sortedResults = sortRows( results, sortKey, sortDirection );
    const pagedResults = sortedResults.slice( offset, offset + pageSize );
    return res.status( 200 ).json( {
      query: searchQuery,
      results: pagedResults,
      totalCount,
      page,
      pageSize,
      sortKey,
      sortDirection,
      searchedSetCount: setsToSearch.length,
      usedSetFilter: true,
      cacheHit: false,
    } );
  } catch ( error ) {
    console.error( "Fuzzy search failed:", error );
    return res.status( 500 ).json( { message: "Internal server error" } );
  }
}
