import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import YugiohPagination from "@/components/Yugioh/YugiohPagination";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/solid';

const PAGE_SIZE = 25;
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
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 6;

const normalizeText = ( value ) => ( value ?? "" ).toString().toLowerCase();
const toSearchText = ( value ) =>
  normalizeText( value ).replace( /[^a-z0-9]+/g, " " ).trim();

const tokenizeQuery = ( query ) =>
  toSearchText( query )
    .split( /\s+/ )
    .filter( Boolean );

const formatPrice = ( value ) => {
  const numeric = Number.parseFloat( value );
  if ( !Number.isFinite( numeric ) ) {
    return "0.00";
  }
  return `$${ numeric.toFixed( 2 ) }`;
};

const fetchFuzzyResults = async ( searchTerm, page, sortKey, sortDirection ) => {
  const response = await fetch(
    `/api/Yugioh/cards/fuzzy-search?q=${ encodeURIComponent(
      searchTerm
    ) }&page=${ page }&pageSize=${ PAGE_SIZE }&sortKey=${ encodeURIComponent(
      sortKey
    ) }&sortDirection=${ encodeURIComponent( sortDirection ) }`
  );
  let data = null;

  try {
    data = await response.json();
  } catch ( error ) {
    data = null;
  }

  const results = Array.isArray( data?.results ) ? data.results : [];
  const message = data?.message || "Search failed.";
  const totalCount =
    typeof data?.totalCount === "number" ? data.totalCount : results.length;
  const responsePage =
    Number.isFinite( data?.page ) && data.page > 0 ? data.page : page;
  const responsePageSize =
    Number.isFinite( data?.pageSize ) && data.pageSize > 0
      ? data.pageSize
      : PAGE_SIZE;

  return {
    ok: response.ok,
    message,
    results,
    totalCount,
    page: responsePage,
    pageSize: responsePageSize,
  };
};

const buildCacheKey = ( query, sortKey, sortDirection ) =>
  `${ toSearchText( query ) }::${ sortKey }::${ sortDirection }`;

const YugiohFuzzySearchResults = () => {
  const router = useRouter();
  const [ query, setQuery ] = useState( "" );
  const [ effectiveSearch, setEffectiveSearch ] = useState( "" );
  const [ results, setResults ] = useState( [] );
  const [ totalCount, setTotalCount ] = useState( 0 );
  const [ isRelaxed, setIsRelaxed ] = useState( false );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( "" );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ sortConfig, setSortConfig ] = useState( {
    key: DEFAULT_SORT_KEY,
    direction: "ascending",
  } );
  const [ selectedConditionByKey, setSelectedConditionByKey ] = useState( {} );
  const cacheRef = useRef( new Map() );
  const activeCacheKeyRef = useRef( "" );

  const buildResultKey = useCallback(
    ( result ) =>
      [
        result?.productName ?? "",
        result?.setName ?? "",
        result?.number ?? "",
        result?.printing ?? "",
        result?.rarity ?? "",
      ].join( "|" ),
    []
  );

  useEffect( () => {
    setSelectedConditionByKey( ( previous ) => {
      const entries = Object.entries( previous || {} );
      if ( entries.length === 0 ) {
        return previous;
      }

      const next = {};
      ( Array.isArray( results ) ? results : [] ).forEach( ( result ) => {
        const key = buildResultKey( result );
        if ( key && previous?.[ key ] ) {
          next[ key ] = previous[ key ];
        }
      } );

      return next;
    } );
  }, [ buildResultKey, results ] );

  const readCacheEntry = useCallback( ( cacheKey ) => {
    const entry = cacheRef.current.get( cacheKey );
    if ( !entry ) {
      return null;
    }

    if ( Date.now() - entry.createdAt > CACHE_TTL_MS ) {
      cacheRef.current.delete( cacheKey );
      return null;
    }

    cacheRef.current.delete( cacheKey );
    cacheRef.current.set( cacheKey, entry );
    return entry;
  }, [] );

  const writeCacheEntry = useCallback( ( cacheKey, entry ) => {
    cacheRef.current.set( cacheKey, entry );
    if ( cacheRef.current.size <= MAX_CACHE_ENTRIES ) {
      return;
    }

    const oldestKey = cacheRef.current.keys().next().value;
    if ( oldestKey ) {
      cacheRef.current.delete( oldestKey );
    }
  }, [] );

  const updateStateFromCache = useCallback( ( entry, page ) => {
    setResults( entry.pages.get( page ) || [] );
    setTotalCount( entry.totalCount || 0 );
    setCurrentPage( page );
    setEffectiveSearch( entry.effectiveSearch || "" );
    setIsRelaxed( Boolean( entry.isRelaxed ) );
    setIsLoading( false );
    setError( "" );
  }, [] );

  const prefetchRemainingPages = useCallback(
    async ( cacheKey, effectiveSearch, totalCount, sortKey, sortDirection ) => {
      const entry = readCacheEntry( cacheKey );
      if ( !entry || entry.prefetching ) {
        return;
      }

      entry.prefetching = true;
      writeCacheEntry( cacheKey, entry );

      const totalPages = Math.max( 1, Math.ceil( totalCount / PAGE_SIZE ) );
      const pagesToFetch = [];
      for ( let page = 1; page <= totalPages; page += 1 ) {
        if ( !entry.pages.has( page ) ) {
          pagesToFetch.push( page );
        }
      }

      const concurrency = 3;
      let cursor = 0;

      const worker = async () => {
        while ( cursor < pagesToFetch.length ) {
          if ( activeCacheKeyRef.current !== cacheKey ) {
            return;
          }

          const nextPage = pagesToFetch[ cursor ];
          cursor += 1;

          try {
            const result = await fetchFuzzyResults(
              effectiveSearch,
              nextPage,
              sortKey,
              sortDirection
            );
            if ( !result.ok ) {
              continue;
            }

            const updated = readCacheEntry( cacheKey );
            if ( !updated ) {
              return;
            }

            updated.pages.set( nextPage, result.results );
            updated.totalCount = result.totalCount;
            writeCacheEntry( cacheKey, updated );
          } catch ( error ) {
            continue;
          }
        }
      };

      await Promise.all( Array.from( { length: concurrency }, worker ) );

      const refreshed = readCacheEntry( cacheKey );
      if ( refreshed ) {
        refreshed.prefetching = false;
        writeCacheEntry( cacheKey, refreshed );
      }
    },
    [ readCacheEntry, writeCacheEntry ]
  );

  const runSearch = useCallback(
    async ( rawQuery, page, sortKey, sortDirection ) => {
      const trimmed = rawQuery.trim();
      setQuery( trimmed );
      setEffectiveSearch( "" );
      setIsRelaxed( false );
      setError( "" );
      setCurrentPage( page );

      if ( !trimmed ) {
        setResults( [] );
        setTotalCount( 0 );
        return;
      }

      const tokens = tokenizeQuery( trimmed );

      if ( tokens.length === 0 ) {
        setError( "Add a card name, set, or set code to search." );
        setResults( [] );
        setTotalCount( 0 );
        return;
      }

      const cacheKey = buildCacheKey( trimmed, sortKey, sortDirection );
      const cachedEntry = readCacheEntry( cacheKey );
      const isNewSearchKey = activeCacheKeyRef.current !== cacheKey;
      activeCacheKeyRef.current = cacheKey;

      if ( isNewSearchKey && !cachedEntry?.pages?.has( page ) ) {
        setResults( [] );
        setTotalCount( 0 );
      }

      if ( cachedEntry?.pages?.has( page ) ) {
        updateStateFromCache( cachedEntry, page );
        return;
      }

      setIsLoading( true );

      let searchTokens = [ ...tokens ];
      let fetched = null;
      let usedSearch = "";
      let errorMessage = "";

      if ( cachedEntry?.effectiveSearch ) {
        const result = await fetchFuzzyResults(
          cachedEntry.effectiveSearch,
          page,
          sortKey,
          sortDirection
        );
        if ( result.ok && result.results.length > 0 ) {
          fetched = result;
          usedSearch = cachedEntry.effectiveSearch;
        }
      }

      while ( !fetched && searchTokens.length > 0 ) {
        const term = searchTokens.join( " " );
        const result = await fetchFuzzyResults(
          term,
          page,
          sortKey,
          sortDirection
        );

        if ( result.ok && result.results.length > 0 ) {
          fetched = result;
          usedSearch = term;
          break;
        }

        if ( !result.ok ) {
          errorMessage = result.message;
          break;
        }

        searchTokens = searchTokens.slice( 0, -1 );
      }

      if ( !fetched ) {
        setError( errorMessage || "No matches found." );
        setResults( [] );
        setTotalCount( 0 );
        setIsLoading( false );
        return;
      }

      const relaxed = usedSearch && usedSearch !== tokens.join( " " );

      setResults( fetched.results );
      setTotalCount( fetched.totalCount );
      setIsRelaxed( relaxed );
      setCurrentPage( fetched.page );
      setEffectiveSearch( usedSearch || tokens.join( " " ) );
      setIsLoading( false );

      const entry = cachedEntry ?? {
        createdAt: Date.now(),
        pages: new Map(),
        totalCount: fetched.totalCount,
        effectiveSearch: usedSearch || tokens.join( " " ),
        isRelaxed: relaxed,
        prefetching: false,
      };

      entry.pages.set( fetched.page, fetched.results );
      entry.totalCount = fetched.totalCount;
      entry.effectiveSearch = usedSearch || tokens.join( " " );
      entry.isRelaxed = relaxed;
      writeCacheEntry( cacheKey, entry );

      if ( fetched.totalCount > fetched.results.length ) {
        prefetchRemainingPages(
          cacheKey,
          entry.effectiveSearch,
          fetched.totalCount,
          sortKey,
          sortDirection
        );
      }
    },
    [
      prefetchRemainingPages,
      readCacheEntry,
      updateStateFromCache,
      writeCacheEntry,
    ]
  );

  useEffect( () => {
    if ( !router.isReady ) {
      return;
    }

    const rawQuery = router.query.q ?? router.query.query ?? "";
    const normalizedQuery = Array.isArray( rawQuery ) ? rawQuery[ 0 ] : rawQuery;
    const rawPage = router.query.page;
    const parsedPage = Array.isArray( rawPage )
      ? Number.parseInt( rawPage[ 0 ], 10 )
      : Number.parseInt( rawPage, 10 );
    const nextPage = Number.isFinite( parsedPage ) && parsedPage > 0 ? parsedPage : 1;
    const rawSortKey = router.query.sortKey;
    const rawSortDirection = router.query.sortDirection;
    const normalizedSortKey = Array.isArray( rawSortKey ) ? rawSortKey[ 0 ] : rawSortKey;
    const normalizedSortDirection = Array.isArray( rawSortDirection )
      ? rawSortDirection[ 0 ]
      : rawSortDirection;
    const nextSortKey = SORTABLE_KEYS.has( normalizedSortKey )
      ? normalizedSortKey
      : DEFAULT_SORT_KEY;
    const nextSortDirection =
      normalizedSortDirection === "descending" || normalizedSortDirection === "desc"
        ? "descending"
        : "ascending";

    setSortConfig( { key: nextSortKey, direction: nextSortDirection } );
    runSearch(
      normalizedQuery ? normalizedQuery.toString() : "",
      nextPage,
      nextSortKey,
      nextSortDirection
    );
  }, [
    router.isReady,
    router.query.q,
    router.query.query,
    router.query.page,
    router.query.sortKey,
    router.query.sortDirection,
    runSearch,
  ] );

  const hasQuery = Boolean( query && query.trim() );
  const displayCountLabel = useMemo( () => {
    if ( !hasQuery ) {
      return "Provide a search query to see matching cards.";
    }

    if ( isLoading ) {
      return "Searching for matches...";
    }

    if ( error ) {
      return error;
    }

    if ( totalCount === 0 ) {
      return "No matches found.";
    }

    return `Found ${ totalCount } possible match${ totalCount === 1 ? "" : "es"
      }.`;
  }, [ error, hasQuery, isLoading, totalCount ] );

  const handleSort = useCallback( ( key ) => {
    if ( !SORTABLE_KEYS.has( key ) ) {
      return;
    }

    const nextDirection =
      sortConfig.key === key && sortConfig.direction === "ascending"
        ? "descending"
        : "ascending";

    router.push( {
      pathname: "/yugioh/search",
      query: {
        q: query,
        page: 1,
        sortKey: key,
        sortDirection: nextDirection,
      },
    } );
  }, [ query, router, sortConfig ] );

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Fuzzy Search Results</title>
        <meta
          name="description"
          content="Browse possible Yu-Gi-Oh! cards that match a fuzzy search query."
        />
        <meta
          name="keywords"
          content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss"
        />
        <meta charSet="UTF-8" />
      </Head>
      <div className="yugioh-bg min-h-screen w-full text-white">
        <Breadcrumb />
        <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-shadow">
                Fuzzy Search Results
              </h1>
              <p className="mt-2 text-sm text-white/80">
                { hasQuery
                  ? `Search query: "${ query }"`
                  : "Provide a search query to see matching cards." }
              </p>
              { effectiveSearch && effectiveSearch !== query ? (
                <p className="mt-1 text-xs text-white/60">
                  Showing matches for "{ effectiveSearch }" and filtering with
                  your full query.
                </p>
              ) : null }
              { isRelaxed ? (
                <p className="mt-1 text-xs text-white/60">
                  No exact matches for every term, showing closest matches.
                </p>
              ) : null }
            </div>
            <Link
              href="/yugioh"
              className="rounded border border-white/60 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
            >
              Back to Price Lookup
            </Link>
          </div>

          <div className="mt-4 text-sm text-white/70">{ displayCountLabel }</div>
          <div className="yugioh-pagination-slot">
            <YugiohPagination
              currentPage={ currentPage }
              itemsPerPage={ PAGE_SIZE }
              totalItems={ totalCount }
              handlePageClick={ ( nextPage ) => {
                router.push( {
                  pathname: "/yugioh/search",
                  query: {
                    q: query,
                    page: nextPage,
                    sortKey: sortConfig.key,
                    sortDirection: sortConfig.direction,
                  },
                } );
              } }
            />
          </div>
          <div className="mt-6 yugioh-stage-table overflow-x-auto rounded-lg border border-white/10 bg-black/40 shadow-2xl">
            { isLoading ? (
              <div className="flex min-h-[20rem] items-center justify-center text-sm text-white/70">
                Loading results...
              </div>
            ) : hasQuery && results.length > 0 ? (
              <table className="min-w-full border-collapse text-sm text-white text-nowrap">
                <thead className="bg-white/10 text-left uppercase text-xs">
                  <tr>
                    { [
                      { key: "productName", label: "Card" },
                      { key: "setName", label: "Set" },
                      { key: "number", label: "Number" },
                      { key: "printing", label: "Printing" },
                      { key: "rarity", label: "Rarity" },
                      { key: "condition", label: "Condition" },
                      { key: "marketPrice", label: "Market Price" },
                    ].map( ( column ) => (
                      <th
                        key={ column.key }
                        onClick={ () => handleSort( column.key ) }
                        className="px-4 py-3 cursor-pointer select-none"
                      >
                        { column.label }
                        { sortConfig.key === column.key ? (
                          <span className="ml-1">
                            { sortConfig.direction === 'ascending' ? (
                              <ChevronUpIcon className="h-2 w-2 text-white font-black inline" />
                            ) : (
                              <ChevronDownIcon className="h-2 w-2 text-white font-black inline" />
                            ) }
                          </span>
                        ) : null }
                      </th>
                    ) ) }
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  { results.map( ( result ) => {
                    const resultKey = buildResultKey( result );
                    const conditions = Array.isArray( result?.conditions ) && result.conditions.length > 0
                      ? result.conditions
                      : [
                        {
                          condition: result?.condition ?? "",
                          marketPrice: result?.marketPrice ?? "0.00",
                          lowPrice: result?.lowPrice ?? "0.00",
                        },
                      ];
                    const defaultCondition = conditions[ 0 ]?.condition ?? "";
                    const storedCondition = selectedConditionByKey[ resultKey ];
                    const hasStoredCondition = conditions.some(
                      ( entry ) => entry?.condition === storedCondition
                    );
                    const selectedCondition = hasStoredCondition
                      ? storedCondition
                      : defaultCondition;
                    const activeConditionEntry =
                      conditions.find( ( entry ) => entry?.condition === selectedCondition ) ||
                      conditions[ 0 ] ||
                      null;
                    const displayedMarketPrice = activeConditionEntry?.marketPrice ?? result?.marketPrice ?? "0.00";

                    const letter = result.setName
                      ? result.setName.charAt( 0 ).toUpperCase()
                      : "A";
                    const detailsQuery = {
                      letter,
                      source: "fuzzy",
                      card_name: result.productName,
                      set_name: result.setName,
                      set_code: result.number,
                      set_rarity: result.rarity,
                    };

                    if ( result.printing ) {
                      detailsQuery.edition = result.printing;
                    }

                    return (
                      <tr
                        key={ resultKey }
                        className="border-t border-white/10 hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold">
                            { result.productName || "Unknown card" }
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          { result.setName || "Unknown set" }
                        </td>
                        <td className="px-4 py-3">
                          { result.number || "N/A" }
                        </td>
                        <td className="px-4 py-3">
                          { result.printing || "N/A" }
                        </td>
                        <td className="px-4 py-3">
                          { result.rarity || "N/A" }
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={ selectedCondition }
                            onChange={ ( event ) => {
                              const nextValue = event.target.value;
                              setSelectedConditionByKey( ( previous ) => ( {
                                ...( previous || {} ),
                                [ resultKey ]: nextValue,
                              } ) );
                            } }
                            className="w-full rounded border border-white/20 bg-white/10 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                            disabled={ conditions.length <= 1 }
                          >
                            { conditions.map( ( entry, index ) => (
                              <option
                                key={ entry?.condition ? `${ entry.condition }-${ index }` : index }
                                value={ entry?.condition ?? "" }
                                className="text-black"
                              >
                                { entry?.condition || "N/A" }
                              </option>
                            ) ) }
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          { formatPrice( displayedMarketPrice ) }
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={ {
                              pathname:
                                "/yugioh/sets/[letter]/cards/card-details",
                              query: detailsQuery,
                            } }
                            className="text-sm font-semibold text-white underline hover:text-white/80"
                          >
                            View card
                          </Link>
                        </td>
                      </tr>
                    );
                  } ) }
                </tbody>
              </table>
            ) : (
              <div className="flex min-h-[20rem] items-center justify-center text-sm text-white/60">
                { hasQuery ? "No matches to display yet." : "Search results will appear here." }
              </div>
            ) }
          </div>
        </div>
        <div className="yugioh-pagination-slot">
          <YugiohPagination
            currentPage={ currentPage }
            itemsPerPage={ PAGE_SIZE }
            totalItems={ totalCount }
            handlePageClick={ ( nextPage ) => {
              router.push( {
                pathname: "/yugioh/search",
                query: {
                  q: query,
                  page: nextPage,
                  sortKey: sortConfig.key,
                  sortDirection: sortConfig.direction,
                },
              } );
            } }
          />
        </div>
      </div>
      <SpeedInsights />
    </>
  );
};

export default YugiohFuzzySearchResults;
