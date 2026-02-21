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

const sortRows = ( items, sortKey, direction ) => {
  const isPriceSort = sortKey === "marketPrice";
  const multiplier = direction === "ascending" ? 1 : -1;

  return [ ...( Array.isArray( items ) ? items : [] ) ].sort( ( a, b ) => {
    const rawA = a?.[ sortKey ];
    const rawB = b?.[ sortKey ];
    const aValue = isPriceSort
      ? Number.parseFloat( rawA ) || 0
      : ( rawA ?? "" ).toString().toLowerCase();
    const bValue = isPriceSort
      ? Number.parseFloat( rawB ) || 0
      : ( rawB ?? "" ).toString().toLowerCase();

    if ( aValue < bValue ) return -1 * multiplier;
    if ( aValue > bValue ) return 1 * multiplier;
    return 0;
  } );
};

const fetchFuzzyResults = async ( searchTerm ) => {
  const response = await fetch(
    `/api/Yugioh/cards/fuzzy-search?q=${ encodeURIComponent( searchTerm ) }&includeAll=1`
  );
  let data = null;

  try {
    data = await response.json();
  } catch ( error ) {
    data = null;
  }

  const results = Array.isArray( data?.results ) ? data.results : [];
  const message = data?.message || "Search failed.";

  return {
    ok: response.ok,
    message,
    results,
  };
};

const YugiohFuzzySearchResults = () => {
  const router = useRouter();
  const [ query, setQuery ] = useState( "" );
  const [ effectiveSearch, setEffectiveSearch ] = useState( "" );
  const [ results, setResults ] = useState( [] );
  const [ isRelaxed, setIsRelaxed ] = useState( false );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( "" );
  const [ currentPage, setCurrentPage ] = useState( 1 );
  const [ sortConfig, setSortConfig ] = useState( {
    key: DEFAULT_SORT_KEY,
    direction: "ascending",
  } );
  const [ selectedConditionByKey, setSelectedConditionByKey ] = useState( {} );
  const activeSearchRef = useRef( { key: "", payload: null } );

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

  const runSearch = useCallback(
    async ( rawQuery ) => {
      const trimmed = rawQuery.trim();
      setQuery( trimmed );
      setEffectiveSearch( "" );
      setIsRelaxed( false );
      setError( "" );
      setCurrentPage( 1 );
      setSortConfig( { key: DEFAULT_SORT_KEY, direction: "ascending" } );

      if ( !trimmed ) {
        setResults( [] );
        return;
      }

      const tokens = tokenizeQuery( trimmed );

      if ( tokens.length === 0 ) {
        setError( "Add a card name, set, or set code to search." );
        setResults( [] );
        return;
      }

      const searchKey = toSearchText( trimmed );
      if ( searchKey && activeSearchRef.current.key === searchKey && activeSearchRef.current.payload ) {
        const cached = activeSearchRef.current.payload;
        setResults( cached.results || [] );
        setEffectiveSearch( cached.effectiveSearch || "" );
        setIsRelaxed( Boolean( cached.isRelaxed ) );
        setIsLoading( false );
        setError( "" );
        return;
      }

      setIsLoading( true );

      let searchTokens = [ ...tokens ];
      let fetched = null;
      let usedSearch = "";
      let errorMessage = "";

      while ( !fetched && searchTokens.length > 0 ) {
        const term = searchTokens.join( " " );
        const result = await fetchFuzzyResults( term );

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
        setIsLoading( false );
        return;
      }

      const relaxed = usedSearch && usedSearch !== tokens.join( " " );
      const fetchedResults = Array.isArray( fetched.results ) ? fetched.results : [];

      setResults( fetchedResults );
      setIsRelaxed( relaxed );
      setEffectiveSearch( usedSearch || tokens.join( " " ) );
      setIsLoading( false );
      activeSearchRef.current = {
        key: searchKey,
        payload: {
          results: fetchedResults,
          effectiveSearch: usedSearch || tokens.join( " " ),
          isRelaxed: relaxed,
        },
      };
    },
    []
  );

  useEffect( () => {
    if ( !router.isReady ) {
      return;
    }

    const rawQuery = router.query.q ?? router.query.query ?? "";
    const normalizedQuery = Array.isArray( rawQuery ) ? rawQuery[ 0 ] : rawQuery;
    runSearch( normalizedQuery ? normalizedQuery.toString() : "" );
  }, [
    router.isReady,
    router.query.q,
    router.query.query,
    runSearch,
  ] );

  const sortedResults = useMemo(
    () => sortRows( results, sortConfig.key, sortConfig.direction ),
    [ results, sortConfig.direction, sortConfig.key ]
  );
  const totalCount = sortedResults.length;
  const paginatedResults = useMemo( () => {
    const start = ( currentPage - 1 ) * PAGE_SIZE;
    return sortedResults.slice( start, start + PAGE_SIZE );
  }, [ currentPage, sortedResults ] );

  useEffect( () => {
    const totalPages = Math.max( 1, Math.ceil( totalCount / PAGE_SIZE ) );
    if ( currentPage > totalPages ) {
      setCurrentPage( totalPages );
    }
  }, [ currentPage, totalCount ] );

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

    setSortConfig( ( previous ) => ( {
      key,
      direction:
        previous.key === key && previous.direction === "ascending"
          ? "descending"
          : "ascending",
    } ) );
    setCurrentPage( 1 );
  }, [] );

  const handlePageClick = useCallback( ( nextPage ) => {
    const totalPages = Math.max( 1, Math.ceil( totalCount / PAGE_SIZE ) );
    if ( nextPage < 1 ) {
      setCurrentPage( 1 );
      return;
    }
    if ( nextPage > totalPages ) {
      setCurrentPage( totalPages );
      return;
    }
    setCurrentPage( nextPage );
  }, [ totalCount ] );

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
              <h1 className="text-5xl font-black text-shadow">
                Search Results
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
              Back to search
            </Link>
          </div>

          <div className="mt-4 text-sm text-white/70">{ displayCountLabel }</div>
          <div className="yugioh-pagination-slot">
            <YugiohPagination
              currentPage={ currentPage }
              itemsPerPage={ PAGE_SIZE }
              totalItems={ totalCount }
              handlePageClick={ handlePageClick }
            />
          </div>
          <div className="mt-6 yugioh-stage-table overflow-x-auto rounded-lg border border-white/10 bg-black/40 shadow-2xl">
            { isLoading ? (
              <div className="flex min-h-[20rem] items-center justify-center text-sm text-white/70">
                Loading results...
              </div>
            ) : hasQuery && paginatedResults.length > 0 ? (
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
                  { paginatedResults.map( ( result ) => {
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
                            { result.productName }
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          { result.setName || "-" }
                        </td>
                        <td className="px-4 py-3">
                          { result.number || "-" }
                        </td>
                        <td className="px-4 py-3">
                          { result.printing || "-" }
                        </td>
                        <td className="px-4 py-3">
                          { result.rarity || "-" }
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
                            disabled={ conditions.length < 1 }
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
            handlePageClick={ handlePageClick }
          />
        </div>
      </div>
      <SpeedInsights />
    </>
  );
};

export default YugiohFuzzySearchResults;
