'use client';

import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { readAuthStateFromCookie, subscribeToAuthState } from '@/utils/authState';

const LoadingSpinner = dynamic( () => import( '@/components/LoadingSpinner' ), { ssr: false } );
const YugiohCardListInput = dynamic( () => import( '@/components/Yugioh/YugiohCardListInput' ), { ssr: false } );
const YugiohCardDataTable = dynamic( () => import( '@/components/Yugioh/YugiohCardDataTable' ), { ssr: false } );

const exampleCardList = `
Nine-Tailed Fox,Duel Power,DUPO-EN031,1st Edition,Ultra Rare,Near Mint 1st Edition
Eidos the Underworld Squire,Brothers of Legend,BROL-EN077,1st Edition,Ultra Rare,Near Mint 1st Edition
Inzektor Exa-Beetle,Brothers of Legend,BROL-EN084,1st Edition,Ultra Rare,Near Mint 1st Edition
Fossil Dig,Brothers of Legend,BROL-EN089,1st Edition,Ultra Rare,Near Mint 1st Edition
`;

const PRINTING_OPTIONS = [ '1st Edition', 'Unlimited', 'Limited Edition' ];
const CONDITION_OPTIONS = [ 'Near Mint', 'Lightly Played', 'Moderately Played', 'Heavily Played', 'Damaged' ];
const SET_CODE_REGEX = /\b(?=[A-Z0-9-]*\d)[A-Z0-9]{2,}-[A-Z0-9-]+\b/i;
const CSV_FIELD_REGEX = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;

const normalizeWhitespace = ( value ) => value.replace( /\s+/g, ' ' ).trim();
const toCanonicalLookup = ( value ) => normalizeWhitespace( value ).toLowerCase();

const findCanonicalOption = ( value, options ) => {
  const normalized = toCanonicalLookup( value );
  return options.find( ( option ) => toCanonicalLookup( option ) === normalized ) || value;
};

const splitCsvLine = ( line ) => {
  const matches = [];
  let match;
  CSV_FIELD_REGEX.lastIndex = 0;

  while ( ( match = CSV_FIELD_REGEX.exec( line ) ) !== null ) {
    matches.push( ( match[ 1 ] || match[ 2 ] || '' ).trim() );
  }

  return matches.map( ( value ) => value.replace( /^"|"$/g, '' ).trim() );
};

const includesLoose = ( left, right ) =>
  ( left ?? '' ).toString().toLowerCase().includes( ( right ?? '' ).toString().toLowerCase() );

const getBaseCondition = ( value ) => {
  const normalized = toCanonicalLookup( value || '' );
  if ( !normalized ) return '';
  return CONDITION_OPTIONS.find( ( option ) => normalized.startsWith( toCanonicalLookup( option ) ) ) || value;
};

const withPrintingInCondition = ( condition, printing ) => {
  const normalizedCondition = normalizeWhitespace( condition || '' );
  const normalizedPrinting = normalizeWhitespace( printing || '' );

  if ( !normalizedCondition || !normalizedPrinting ) {
    return normalizedCondition;
  }

  if ( includesLoose( normalizedCondition, normalizedPrinting ) ) {
    return normalizedCondition;
  }

  return `${ normalizedCondition } ${ normalizedPrinting }`;
};

const parseFreeformLine = ( line, knownSetNames ) => {
  const normalizedLine = normalizeWhitespace( line );
  if ( !normalizedLine ) return null;

  const setCodeMatch = normalizedLine.match( SET_CODE_REGEX );
  if ( !setCodeMatch?.[ 0 ] ) {
    return null;
  }

  const number = setCodeMatch[ 0 ];
  const numberStart = setCodeMatch.index ?? 0;
  const beforeNumber = normalizeWhitespace( normalizedLine.slice( 0, numberStart ) );
  let afterNumber = normalizeWhitespace( normalizedLine.slice( numberStart + number.length ) );

  if ( !beforeNumber || !afterNumber ) {
    return null;
  }

  const sortedSetNames = [ ...knownSetNames ].sort( ( a, b ) => b.length - a.length );
  const beforeLower = toCanonicalLookup( beforeNumber );
  const matchedSetName = sortedSetNames.find( ( setName ) =>
    beforeLower.endsWith( toCanonicalLookup( setName ) )
  );

  if ( !matchedSetName ) {
    return null;
  }

  const productName = normalizeWhitespace( beforeNumber.slice( 0, beforeNumber.length - matchedSetName.length ) );
  if ( !productName ) {
    return null;
  }

  let printing = '';
  const matchedPrinting = PRINTING_OPTIONS.find( ( option ) =>
    toCanonicalLookup( afterNumber ).startsWith( toCanonicalLookup( option ) )
  );
  if ( matchedPrinting ) {
    printing = matchedPrinting;
    afterNumber = normalizeWhitespace( afterNumber.slice( matchedPrinting.length ) );
  }

  const conditionRegex = new RegExp(
    `(${ CONDITION_OPTIONS.map( ( option ) => option.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) ).join( '|' ) })` +
    `(?:\\s+(${ PRINTING_OPTIONS.map( ( option ) => option.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) ).join( '|' ) }))?$`,
    'i'
  );

  let rarity = '';
  let condition = '';
  const conditionMatch = afterNumber.match( conditionRegex );
  if ( conditionMatch ) {
    const baseCondition = findCanonicalOption( conditionMatch[ 1 ], CONDITION_OPTIONS );
    const conditionPrinting = conditionMatch[ 2 ]
      ? findCanonicalOption( conditionMatch[ 2 ], PRINTING_OPTIONS )
      : '';

    const conditionStart = conditionMatch.index ?? afterNumber.length;
    rarity = normalizeWhitespace( afterNumber.slice( 0, conditionStart ) );
    condition = conditionPrinting ? `${ baseCondition } ${ conditionPrinting }` : baseCondition;

    if ( !printing && conditionPrinting ) {
      printing = conditionPrinting;
    }
  } else {
    rarity = afterNumber;
  }

  return {
    productName,
    setName: matchedSetName,
    number,
    printing,
    rarity,
    condition,
  };
};

const parseCardLine = ( line, knownSetNames ) => {
  const normalizedLine = normalizeWhitespace( line );
  if ( !normalizedLine ) return null;

  if ( normalizedLine.includes( ',' ) ) {
    const fields = splitCsvLine( normalizedLine );
    if ( fields.length >= 6 ) {
      const [ rawProductName, setName, number, printing, rarity, condition ] = fields;
      return {
        productName: rawProductName,
        setName,
        number,
        printing,
        rarity,
        condition,
      };
    }
  }

  return parseFreeformLine( normalizedLine, knownSetNames );
};

const Home = () => {
  const [ collection, setCollection ] = useState( [] );
  const [ selectedRows, setSelectedRows ] = useState( [] );
  const [ cardList, setCardList ] = useState( [] );
  const [ matchedCardData, setMatchedCardData ] = useState( [] );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( null );
  const fetchedSetData = useRef( {} );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const [ username, setUsername ] = useState( "" );
  const [ setNameIdMap, setSetNameIdMap ] = useState( {} );
  const [ fuzzyQuery, setFuzzyQuery ] = useState( '' );
  const [ fuzzyError, setFuzzyError ] = useState( '' );
  const router = useRouter();

  useEffect( () => {
    const fetchSetNameIdMap = async () => {
      try {
        const response = await fetch( '/api/Yugioh/setNameIdMap' );
        if ( !response.ok ) {
          throw new Error( `Set map request failed with status ${ response.status }` );
        }

        const data = await response.json();
        setSetNameIdMap( data );
      } catch ( error ) {
        console.error( 'Failed to fetch setNameIdMap:', error );
      }
    };

    fetchSetNameIdMap();
  }, [] );

  useEffect( () => {
    const syncAuthState = () => {
      setIsAuthenticated( readAuthStateFromCookie() );
    };

    syncAuthState();
    const unsubscribe = subscribeToAuthState( ( state ) => setIsAuthenticated( Boolean( state ) ) );
    window.addEventListener( 'focus', syncAuthState );

    return () => {
      unsubscribe();
      window.removeEventListener( 'focus', syncAuthState );
    };
  }, [] );

  useEffect( () => {
    let isActive = true;

    const loadUsername = async () => {
      if ( !isAuthenticated ) {
        if ( isActive ) {
          setUsername( "" );
        }
        return;
      }

      try {
        const response = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include",
        } );

        if ( !response.ok ) {
          if ( isActive ) {
            setUsername( "" );
          }
          return;
        }

        const data = await response.json();
        if ( isActive ) {
          setUsername( data?.username || "" );
        }
      } catch ( error ) {
        console.error( "Failed to load username:", error );
        if ( isActive ) {
          setUsername( "" );
        }
      }
    };

    loadUsername();

    return () => {
      isActive = false;
    };
  }, [ isAuthenticated ] );

  const handleLoadExampleData = () => {
    setCardList( exampleCardList.trim() );
  };

  const handleFuzzySubmit = ( event ) => {
    event.preventDefault();
    const trimmedQuery = fuzzyQuery.trim();

    if ( !trimmedQuery ) {
      setFuzzyError( 'Enter a card name, set, or set code to search.' );
      return;
    }

    setFuzzyError( '' );
    router.push( `/yugioh/search?q=${ encodeURIComponent( trimmedQuery ) }` );
  };

  const fetchCardData = useCallback( async ( card, setCache ) => {
    try {
      const { productName, setName, number, printing, rarity, condition } = card;
      const setNameId = setNameIdMap[ setName ];

      if ( !setNameId ) {
        console.error( `Numerical setNameId not found for set name: ${ setName }` );
      }

      if ( !setCache[ setNameId ] ) {
        console.log( 'Fetching set data for ID:', setNameId );
        const response = await fetch( `/api/Yugioh/cards/${ setNameId }` );
        if ( !response.ok ) {
          return { card, data: null, error: `Failed to fetch set data for ID: ${ setNameId }` };
        }
        const responseData = await response.json();
        fetchedSetData.current[ setNameId ] = responseData;
        setCache[ setNameId ] = responseData;
      }

      const setCardData = setCache[ setNameId ];
      const baseCondition = getBaseCondition( condition );
      const matchedCard = setCardData?.result.find( ( setCard ) =>
        includesLoose( setCard.productName, productName ) &&
        includesLoose( setCard.set, setName ) &&
        includesLoose( setCard.number, number ) &&
        includesLoose( setCard.printing, printing ) &&
        includesLoose( setCard.rarity, rarity ) &&
        (
          includesLoose( setCard.condition, condition ) ||
          includesLoose( setCard.condition, baseCondition )
        )
      );

      if ( !matchedCard || matchedCard.marketPrice === undefined ) {
        return { card, data: { marketPrice: "0.00" }, error: 'Market price not found.' };
      }

      const resolvedPrinting = matchedCard?.printing || printing;
      const resolvedCondition = withPrintingInCondition(
        matchedCard?.condition || condition,
        resolvedPrinting
      );

      return {
        card: {
          ...card,
          printing: resolvedPrinting,
          condition: resolvedCondition,
          rarity: matchedCard?.rarity || rarity,
        },
        data: { ...matchedCard, marketPrice: matchedCard.marketPrice },
        error: null,
      };
    } catch ( error ) {
      console.error( 'Error fetching card data:', error );
      return { card, data: { marketPrice: "0.00" }, error: 'No market price available' };
    }
  }, [ setNameIdMap ] );

  const processBatches = async ( items, batchSize, asyncCallback ) => {
    const results = [];

    for ( let i = 0; i < items.length; i += batchSize ) {
      const batch = items.slice( i, i + batchSize );
      console.log( `Processing batch: ${ i / batchSize + 1 }` );

      const batchResults = await Promise.all(
        batch.map( async ( item ) => {
          try {
            return await asyncCallback( item );
          } catch ( error ) {
            return { item, data: null, error: error.message };
          }
        } )
      );

      results.push( ...batchResults );
    }

    return results;
  };

  const handleSubmit = async ( event ) => {
    event.preventDefault();
    setIsLoading( true );
    setError( null );
    const setCache = {};

    try {
      const knownSetNames = Object.keys( setNameIdMap || {} );
      const rawLines = cardList
        .split( '\n' )
        .map( ( line ) => normalizeWhitespace( line ) )
        .filter( Boolean );

      if ( knownSetNames.length === 0 && rawLines.some( ( line ) => !line.includes( ',' ) ) ) {
        setError( 'Set data is still loading. Please try again in a moment.' );
        return;
      }

      const invalidLines = [];
      const cards = rawLines
        .map( ( line, index ) => {
          const parsed = parseCardLine( line, knownSetNames );
          if ( !parsed ) {
            invalidLines.push( index + 1 );
            return null;
          }
          return parsed;
        } )
        .filter( Boolean );

      if ( invalidLines.length > 0 ) {
        setError(
          `Could not parse line${ invalidLines.length > 1 ? 's' : '' } ${ invalidLines.join( ', ' ) }. ` +
          'Use the order: name, setName, number, printing, rarity, condition (commas optional).'
        );
        return;
      }

      if ( cards.length === 0 ) {
        setError( 'Card list is empty.' );
        return;
      }

      const batchSize = 50;
      const fetchedCardData = await processBatches( cards, batchSize, ( card ) => fetchCardData( card, setCache ) );
      setMatchedCardData( fetchedCardData );
    } catch ( error ) {
      setError( 'Error fetching card data' );
      console.error( error );
    } finally {
      setIsLoading( false );
    }
  };

  const welcomeSuffix = username ? `, ${ username }` : "";

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Prices</title>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="yugioh-bg min-h-screen w-full text-white">
        <main className="mx-auto w-full max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
          <header className="rounded-3xl border border-white/10 bg-black/45 p-6 shadow-2xl backdrop-blur">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/50">Yu-Gi-Oh!</p>
                <h1 className="mt-4 text-4xl font-bold tracking-tight text-white lg:text-5xl">
                  Welcome{ welcomeSuffix }!
                </h1>
                <p className="mt-4 text-base text-white/70">
                  Search a single card, paste a bulk list, and review pricing results in one workflow.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/yugioh/sets/set-index"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
                >
                  Browse Sets
                </Link>
                <Link
                  href={ isAuthenticated ? "/yugioh/my-collection" : "/login" }
                  className="inline-flex items-center justify-center rounded-full border border-indigo-400/30 bg-indigo-500/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-indigo-300/60 hover:bg-indigo-500/30"
                >
                  { isAuthenticated ? "My Collection" : "Log In" }
                </Link>
              </div>
            </div>
          </header>

          <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Quick Search</p>
              <h2 className="mt-3 text-2xl font-bold text-white">Find a single card fast</h2>
              <p className="mt-3 text-sm text-white/70">
                Search by card name, set name, or set code. Partial terms such as <span className="font-semibold text-white">Blue-Eyes</span> also return close matches.
              </p>
              <form
                onSubmit={ handleFuzzySubmit }
                className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <input
                  type="text"
                  value={ fuzzyQuery }
                  onChange={ ( event ) => {
                    setFuzzyQuery( event.target.value );
                    if ( fuzzyError ) {
                      setFuzzyError( '' );
                    }
                  } }
                  placeholder="Search by card name, set, or set code"
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-base text-white placeholder:text-white/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
                >
                  Search
                </button>
              </form>
              { fuzzyError ? (
                <p className="mt-3 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-100">{ fuzzyError }</p>
              ) : null }
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Bulk Lookup</p>
                  <h2 className="mt-3 text-2xl font-bold text-white">Paste a list and match pricing</h2>
                </div>
                <button
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15"
                  onClick={ handleLoadExampleData }
                  type="button"
                >
                  Load Example
                </button>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
                <div>
                  <p className="text-sm text-white/70">Use this order for each line:</p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    Name, Set, Number, Edition, Rarity, Condition
                  </p>
                  <p className="mt-3 text-sm text-white/60">
                    Commas are optional when the values stay in the same sequence.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/75">
                  <p className="font-semibold text-white">Accepted conditions</p>
                  <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                    <li>Near Mint + Edition</li>
                    <li>Lightly Played + Edition</li>
                    <li>Moderately Played + Edition</li>
                    <li>Heavily Played + Edition</li>
                    <li>Damaged + Edition</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <YugiohCardListInput
                  collection={ collection }
                  selectedRows={ selectedRows }
                  setSelectedRows={ setSelectedRows }
                  setCollection={ setCollection }
                  cardList={ cardList }
                  setCardList={ setCardList }
                  handleSubmit={ handleSubmit }
                  isLoading={ isLoading }
                  error={ error }
                  matchedCardData={ matchedCardData }
                  setMatchedCardData={ setMatchedCardData }
                />
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Results</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Matched cards</h2>
              </div>
              <div className="text-center text-sm font-semibold text-white/70 sm:text-right">
                { isLoading ? <LoadingSpinner /> : `${ matchedCardData.length || 0 } matches loaded` }
              </div>
            </div>

            <div className="mt-6 w-full yugioh-stage">
              { Array.isArray( matchedCardData ) && matchedCardData.length > 0 ? (
                <YugiohCardDataTable
                  matchedCardData={ matchedCardData }
                  isAuthenticated={ isAuthenticated }
                />
              ) : (
                <div className="flex min-h-[24rem] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/30 px-6 text-center text-sm text-white/60">
                  { isLoading ? "Loading results..." : "Results will appear here after you search or submit a card list." }
                </div>
              ) }
            </div>
          </section>
        </main>
      </div>
      <SpeedInsights />
    </>
  );
};

export default Home;
