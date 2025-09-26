'use client';

import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect, useRef } from 'react';
import { SpeedInsights } from '@vercel/speed-insights/next';

const LoadingSpinner = dynamic( () => import( '@/components/LoadingSpinner' ), { ssr: false } );
const YugiohCardListInput = dynamic( () => import( '@/components/Yugioh/YugiohCardListInput' ), { ssr: false } );
const YugiohCardDataTable = dynamic( () => import( '@/components/Yugioh/YugiohCardDataTable' ), { ssr: false } );

const exampleCardList = `
Nine-Tailed Fox,Duel Power,DUPO-EN031,1st Edition,Ultra Rare,Near Mint 1st Edition
Eidos the Underworld Squire,Brothers of Legend,BROL-EN077,1st Edition,Ultra Rare,Near Mint 1st Edition
Inzektor Exa-Beetle,Brothers of Legend,BROL-EN084,1st Edition,Ultra Rare,Near Mint 1st Edition
Fossil Dig,Brothers of Legend,BROL-EN089,1st Edition,Ultra Rare,Near Mint 1st Edition
`;

const Home = () => {
  const [ collection, setCollection ] = useState( [] );
  const [ selectedRows, setSelectedRows ] = useState( [] );
  const [ cardList, setCardList ] = useState( [] );
  const [ matchedCardData, setMatchedCardData ] = useState( [] );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( null );
  const fetchedSetData = useRef( {} );
  const [ setNameIdMap, setSetNameIdMap ] = useState( {} );

  useEffect( () => {
    const fetchSetNameIdMap = async () => {
      try {
        const response = await fetch( '/api/Yugioh/setNameIdMap' );
        const data = await response.json();
        setSetNameIdMap( data );
      } catch ( error ) {
        console.error( 'Failed to fetch setNameIdMap:', error );
      }
    };

    fetchSetNameIdMap();
  }, [] );

  const handleLoadExampleData = () => {
    setCardList( exampleCardList.trim() );
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
      const matchedCard = setCardData?.result.find( ( setCard ) =>
        setCard.productName.includes( productName ) &&
        setCard.set.includes( setName ) &&
        setCard.number.includes( number ) &&
        setCard.printing.includes( printing ) &&
        setCard.rarity.includes( rarity ) &&
        setCard.condition.includes( condition )
      );

      if ( !matchedCard || matchedCard.marketPrice === undefined ) {
        return { card, data: { marketPrice: "0.00" }, error: 'Market price not found.' };
      }

      return { card, data: { ...matchedCard, marketPrice: matchedCard.marketPrice }, error: null };
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
      const cards = cardList.trim().split( '\n' ).map( ( line ) => {
        const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
        const matches = [];
        let match;
        while ( ( match = regex.exec( line ) ) !== null ) {
          matches.push( match[ 1 ] || match[ 2 ] );
        }
        if ( matches.length !== 6 ) {
          alert( 'Invalid card format' );
        }

        const [ rawProductName, setName, number, printing, rarity, condition ] = matches.map( ( s ) => s.trim() );
        const productName = rawProductName.replace( /^"|"$/g, '' );
        return { productName, setName, number, printing, rarity, condition };
      } );

      if ( cards.length === 0 ) {
        alert( 'Card list is empty' );
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
      <main className="mx-auto -p-2 w-full">
        <div className="yugioh-bg w-full mx-auto min-h-screen text-center">
          <h1 className="text-4xl font-bold mb-8">Welcome to the thing!</h1>

          <span className="pb-3 mx-auto text-center">
            <p>
              Enter a comma-separated (CSV format) list of cards below in the order of:
              <br />
              <span className="font-black underline">[Name],[Set],[Number],[Edition],[Rarity],[Condition]</span>
            </p>
            <p className="py-3">where the possible conditions are:</p>
            <ul className="columns-2 space-y-1 font-semibold text-center text-pretty">
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



          <div className="w-full mx-auto">
            <div className="text-center z-50 font-black">
              { isLoading && <LoadingSpinner /> }
            </div>
            <YugiohCardDataTable
              matchedCardData={ matchedCardData }
              setMatchedCardData={ setMatchedCardData }
            />
          </div>
        </div>
      </main>


      <SpeedInsights />
    </>
  );
};

export default Home;
