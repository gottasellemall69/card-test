'use client';

import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
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

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Prices</title>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="yugioh-bg min-h-screen w-full mx-auto text-center p-2">

        <h1 className="text-4xl font-bold mb-8">Welcome to the thing!</h1>

        <div className="mx-auto w-full max-w-3xl text-center text-white">
          <h2 className="text-xl font-black text-shadow">Search for a single card</h2>
          <p className="mt-2 text-sm text-white/80">
            Search for any card by card name, set name, or set code. Returns any similar results of the searched term as well if just a name is given. Example: Nine-Tailed Fox
            Duel Power <i>or</i> DUPO-EN031. A search for "Blue-Eyes" will return any card relating to the Blue-Eyes White Dragon.
          </p>
          <form
            onSubmit={ handleFuzzySubmit }
            className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
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
              placeholder="Search for a card..."
              className="w-full max-w-md rounded border border-white/40 bg-transparent px-4 py-2 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button
              type="submit"
              className="border border-white rounded px-4 py-2 text-sm font-bold text-white hover:text-black hover:bg-white"
            >
              Search
            </button>
          </form>
          { fuzzyError ? (
            <p className="mt-2 text-sm text-red-200">{ fuzzyError }</p>
          ) : null }
        </div>
        <p className="my-5 text-white font-semibold text-shadow">
          OR
        </p>
        <span className="py-3 mx-auto text-center">
          <p>
            Enter cards in this order:
            <br />
            <span className="font-black underline">Name, Set, Number, Edition, Rarity, Condition</span>
          </p>
          <p className="py-2 text-sm text-white/80">
            Commas are optional. Example: <span className="font-semibold">Nine-Tailed Fox Duel Power DUPO-EN031 1st Edition Ultra Rare Near Mint 1st Edition</span>
          </p>
          <p className="py-3">where the possible conditions are:</p>
          <ul className="columns-2 space-y-1 font-semibold text-center text-pretty object-center justify-evenly">
            <li>Near Mint+[Edition]</li>
            <li>Lightly Played+[Edition]</li>
            <li>Moderately Played+[Edition]</li>
            <li>Heavily Played+[Edition]</li>
            <li>Damaged+[Edition]</li>
          </ul>
        </span>

        <div className="mx-auto text-center my-4">
          <p>Try it out:</p>
          <button
            className="mx-auto sm:mx-0 text-sm border border-white rounded px-4 py-2 mt-3 text-white font-bold hover:text-black hover:bg-white"
            onClick={ handleLoadExampleData }
          >
            Load Example Data
          </button>
        </div>
        <div className="p-2 min-h-fit w-auto">

          <div className="w-full mx-auto">
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



        <div className="mt-5 w-full mx-auto">
          <div className="text-center z-50 font-black">
            { isLoading && <LoadingSpinner /> }
          </div>
          <div className="mt-2 w-full max-w-7xl mx-auto yugioh-stage">
            { Array.isArray( matchedCardData ) && matchedCardData.length > 0 ? (
              <YugiohCardDataTable
                matchedCardData={ matchedCardData }
                isAuthenticated={ isAuthenticated }
              />
            ) : (
              <div className="flex min-h-[24rem] items-center justify-center text-sm text-white/60">
                { isLoading ? "Loading results..." : "Results will appear here after you search." }
              </div>
            ) }
          </div>
        </div>
      </div>
      </div>
      <SpeedInsights />
    </>
  );
};

export default Home;
