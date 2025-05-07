"use client";
import dynamic from 'next/dynamic';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Head from 'next/head';
import { useState, useCallback, useEffect, useRef } from 'react';
const LoadingSpinner = dynamic( () => import( '@/components/LoadingSpinner.js' ), { ssr: false } );
const YugiohCardListInput = dynamic( () => import( '@/components/Yugioh/YugiohCardListInput.js' ), { ssr: false } );
const YugiohCardDataTable = dynamic( () => import( '@/components/Yugioh/YugiohCardDataTable.js' ), { ssr: false } );
// Example card list data
const exampleCardList =
  `Nine-Tailed Fox,Duel Power,DUPO-EN031,1st Edition,Ultra Rare,Near Mint 1st Edition
Eidos the Underworld Squire,Brothers of Legend,BROL-EN077,1st Edition,Ultra Rare,Near Mint 1st Edition
Inzektor Exa-Beetle,Brothers of Legend,BROL-EN084,1st Edition,Ultra Rare,Near Mint 1st Edition
Fossil Dig,Brothers of Legend,BROL-EN089,1st Edition,Ultra Rare,Near Mint 1st Edition`;

const Home = () => {
  const [ collection, setCollection ] = useState( [] );
  const [ selectedRows, setSelectedRows ] = useState( [] );
  const [ cardList, setCardList ] = useState( [] );
  const [ matchedCardData, setMatchedCardData ] = useState( [] );
  const [ isLoading, setIsLoading ] = useState( false );
  const [ error, setError ] = useState( null );

  const handleLoadExampleData = () => {
    setCardList( exampleCardList );
  };

  const fetchedSetData = useRef( {} );
  const [ setNameIdMap, setSetNameIdMap ] = useState( {} );

  // Fetch setNameIdMap from the endpoint once on component mount
  useEffect( () => {
    const fetchSetNameIdMap = async () => {
      try {
        const response = await fetch( `/api/Yugioh/setNameIdMap` );
        const data = await response.json();
        setSetNameIdMap( data );
      } catch ( error ) {
        console.error( "Failed to fetch setNameIdMap:", error );
      }
    };
    fetchSetNameIdMap();
  }, [] );

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
          console.error( `Failed to fetch card data for set ID: ${ setNameId }` );
          return { card, data: null, error: `Failed to fetch set data for ID: ${ setNameId }` };
        }
        const responseData = await response.json();
        fetchedSetData.current[ setNameId ] = responseData;
        setCache[ setNameId ] = responseData;
      } else {
        console.log( 'Using cached set data for ID:', setNameId );
      }
      const setCardData = setCache[ setNameId ];

      const matchedCard = setCardData?.result.find( ( setCard ) => {
        return (
          setCard.productName.includes( productName ) &&
          setCard.set.includes( setName ) &&
          setCard.number.includes( number ) &&
          setCard.printing.includes( printing ) &&
          setCard.rarity.includes( rarity ) &&
          setCard.condition.includes( condition )
        );
      } );

      if ( !matchedCard || !matchedCard?.marketPrice ) {
        console.error( 'Market price data not found for the card' );
        return { card, data: { marketPrice: parseFloat( "0" ).toFixed( 2 ) }, error: 'Market price not found.' };
      }
      const marketPrice = matchedCard?.marketPrice !== undefined ? matchedCard.marketPrice : parseFloat( "0" ).toFixed( 2 );
      console.log( 'Matched card:', matchedCard );
      return { card, data: { ...matchedCard, marketPrice }, error: null };
    } catch ( error ) {
      console.error( 'Error fetching card data:', error );
      return { card, data: { marketPrice: parseFloat( "0" ).toFixed( 2 ) }, error: 'No market price available' };
    }
  }, [ setNameIdMap ] );

  const processBatches = async ( items, batchSize, asyncCallback ) => {
    const results = [];
    for ( let i = 0; i < items.length; i += batchSize ) {
      const batch = items.slice( i, i + batchSize );
      console.log( `Processing batch: ${ i / batchSize + 1 }` );
      const batchResults = await Promise.all( batch.map( async ( item ) => {
        try {
          return await asyncCallback( item );
        } catch ( error ) {
          console.error( 'Error processing item:', item, error );
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
    console.log( 'Form submitted' );
    console.log( 'Card List:', cardList );
    console.log( 'Is loading:', isLoading );

    const setCache = {};

    try {
      const cards = cardList.trim().split( '\n' ).map( ( cardLine ) => {
        const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
        const matches = [];
        let match;
        while ( ( match = regex.exec( cardLine ) ) !== null ) {
          matches.push( match[ 1 ] || match[ 2 ] );
        }
        if ( matches.length !== 6 ) {
          alert( 'Invalid card format' );
        }
        const [ rawProductName, setName, number, printing, rarity, condition ] = matches.map( ( match ) => match.trim() );
        const productName = rawProductName.replace( /^"|"$/g, '' );
        return { productName, setName, number, printing, rarity, condition };
      } );

      if ( cards.length === 0 ) {
        alert( 'Card list is empty' );
        return;
      }

      const batchSize = 50;
      const fetchedCardData = await processBatches( cards, batchSize, ( card ) => fetchCardData( card, setCache ) );
      console.log( 'Parsed cards:', cards );
      console.log( 'Fetched card data:', fetchedCardData );
      setMatchedCardData( fetchedCardData );
    } catch ( error ) {
      setError( 'Error fetching card data' );
      console.error( 'Error fetching card data:', error );
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
        <meta name="charset" content="UTF-8" />

      </Head>
      <div className="w-full text-center sm:text-left max-w-7xl mx-auto min-h-screen">
        <h1 className="text-4xl font-bold mb-8 text-center sm:text-left">Welcome to the thing!</h1>
        <header className="inline-block mx-auto sm:w-full text-pretty pb-3">
          Enter a comma-separated (CSV format) list of cards below in the order of:
          <br />
          <span className='font-black underline underline-offset-auto'>
            [Name],[Set],[Number],[Edition],[Rarity],[Condition]
          </span>
          <br />
          <p className="py-3">where the possible conditions are:</p>

          <ul className="inline-block w-full max-w-prose text-center sm:text-left text-ellipsis columns-2 space-y-1 font-semibold">

            <li>Near Mint+[Edition]</li>
            <li>Lightly Played+[Edition]</li>
            <li>Moderately Played+[Edition]</li>
            <li>Heavily Played+[Edition]</li>
            <li>Damaged+[Edition]</li>
          </ul>
        </header>

        <div className="inline-block w-full max-w-prose text-center sm:text-left text-pretty">
          Try it out:
          <br />
          <button
            className="inline my-2 text-sm border border-white rounded px-2 py-2 text-white font-bold hover:text-black hover:bg-white"
            onClick={ handleLoadExampleData }>
            Load Example Data
          </button>
        </div>
        <main>

          <div className="mx-auto w-full max-w-7xl min-h-fit mt-10 align-bottom place-self-stretch">
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
        </main>
        <footer>
          <div className='mx-auto object-center self-center place-content-center z-50 text-shadow font-black'>
            { isLoading && <LoadingSpinner /> }
          </div>
          <div className="mx-auto w-full max-w-7xl min-h-fit">
            <YugiohCardDataTable
              matchedCardData={ matchedCardData }
              setMatchedCardData={ setMatchedCardData }
            />
          </div>
        </footer>
      </div>

      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default Home;
