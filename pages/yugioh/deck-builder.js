"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Head from "next/head";

const MAIN_DECK_MIN = 40;
const MAIN_DECK_MAX = 60;
const EXTRA_DECK_MAX = 15;
const MAX_COPIES_PER_CARD = 3;
const EXTRA_DECK_TYPES = [ "Fusion", "Synchro", "XYZ", "Link" ];

const isExtraDeckCard = ( card ) => {
  const type = card?.type ?? "";
  return EXTRA_DECK_TYPES.some( ( classification ) => type.includes( classification ) );
};

const buildDeckWarnings = ( mainDeck, extraDeck ) => {
  const warnings = [];
  const mainDeckCount = mainDeck.filter( Boolean ).length;
  const extraDeckCount = extraDeck.length;

  if ( mainDeckCount < MAIN_DECK_MIN ) warnings.push( `Main Deck must have at least ${ MAIN_DECK_MIN } cards.` );
  if ( mainDeckCount > MAIN_DECK_MAX ) warnings.push( `Main Deck cannot exceed ${ MAIN_DECK_MAX } cards.` );
  if ( extraDeckCount > EXTRA_DECK_MAX ) warnings.push( `Extra Deck cannot exceed ${ EXTRA_DECK_MAX } cards.` );

  const cardCounts = {};
  [ ...mainDeck, ...extraDeck ].forEach( ( card ) => {
    if ( !card ) return;
    cardCounts[ card.id ] = ( cardCounts[ card.id ] || 0 ) + 1;
    if ( cardCounts[ card.id ] > MAX_COPIES_PER_CARD ) {
      warnings.push( `${ card.name } exceeds the maximum of ${ MAX_COPIES_PER_CARD } copies allowed.` );
    }
  } );

  return warnings;
};

export default function DeckBuilder() {
  const [ search, setSearch ] = useState( "" );
  const [ cards, setCards ] = useState( null );
  const [ deck, setDeck ] = useState( Array( MAIN_DECK_MIN ).fill( null ) );
  const [ extraDeck, setExtraDeck ] = useState( [] );
  const [ error, setError ] = useState( null );
  const [ archetypeSuggestions, setArchetypeSuggestions ] = useState( null );
  const [ deckWarnings, setDeckWarnings ] = useState( [] );
  const [ searchTerm, setSearchTerm ] = useState( "" );
  const [ statusMessage, setStatusMessage ] = useState( null );

  useEffect( () => {
    setDeckWarnings( buildDeckWarnings( deck, extraDeck ) );
  }, [ deck, extraDeck ] );

  const fetchArchetypeSuggestions = useCallback( async ( archetype ) => {
    if ( !archetype ) {
      setArchetypeSuggestions( null );
      return;
    }

    try {
      const response = await fetch(
        `/api/Yugioh/cards/recommendations?archetype=${ encodeURIComponent( archetype ) }`
      );
      const data = await response.json();

      if ( !response.ok || !data.relatedCards?.length ) {
        setArchetypeSuggestions( null );
      } else {
        setArchetypeSuggestions( data.relatedCards );
      }
    } catch ( err ) {
      console.error( "Failed to fetch archetype suggestions:", err );
      setArchetypeSuggestions( null );
    }
  }, [] );

  const searchCards = useCallback( async () => {
    setError( null );
    setStatusMessage( null );
    try {
      const response = await fetch(
        `/api/Yugioh/cards/recommendations?search=${ encodeURIComponent( search ) }`
      );
      const data = await response.json();

      if ( !response.ok ) {
        setError( data.message );
        setCards( null );
      } else {
        setCards( data );
        fetchArchetypeSuggestions( data.searchedCard?.archetype );
      }
    } catch ( err ) {
      setError( "Failed to fetch cards" );
    }
  }, [ fetchArchetypeSuggestions, search ] );

  const addToDeck = useCallback( ( card ) => {
    if ( !card ) return;
    const extraDeckCard = isExtraDeckCard( card );

    if ( extraDeckCard ) {
      setExtraDeck( ( prev ) => {
        if ( prev.length >= EXTRA_DECK_MAX ) {
          setStatusMessage( "Extra Deck is full. Cannot add more cards." );
          return prev;
        }

        setStatusMessage( null );
        return [ ...prev, card ];
      } );
      return;
    }

    setDeck( ( prev ) => {
      const emptySlotIndex = prev.findIndex( ( slot ) => slot === null );
      if ( emptySlotIndex === -1 ) {
        setStatusMessage( "Main Deck is full. Cannot add more cards." );
        return prev;
      }

      const nextDeck = [ ...prev ];
      nextDeck[ emptySlotIndex ] = card;
      setStatusMessage( null );
      return nextDeck;
    } );
  }, [] );

  const removeFromDeck = useCallback( ( index, isExtraDeck = false ) => {
    if ( isExtraDeck ) {
      setExtraDeck( ( prev ) => prev.filter( ( _, i ) => i !== index ) );
      return;
    }

    setDeck( ( prev ) => prev.map( ( slot, slotIndex ) => ( slotIndex === index ? null : slot ) ) );
  }, [] );

  const filteredArchetypeSuggestions = useMemo( () => {
    if ( !archetypeSuggestions ) return null;
    return archetypeSuggestions.filter( ( card ) =>
      card.name.toLowerCase().includes( searchTerm.toLowerCase() )
    );
  }, [ archetypeSuggestions, searchTerm ] );

  return (
    <>
      <Head>
        <title>Yu-Gi-Oh! Deck Builder</title>
        <meta name="description" content="Build decks and stuff, I don't know..." />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="p-6 glass min-h-screen yugioh-bg text-black">
        <h1 className="text-3xl font-bold mb-4 text-white">Yu-Gi-Oh! Deck Builder</h1>

        <div className="flex flex-1 gap-x-2">
          {/* Deck Panel */ }
          <div className="flex-1 glass p-4 shadow overflow-auto">
            <h2 className="text-2xl font-bold text-white">Deck</h2>
            <p className="text-sm text-white">
              Main Deck: { deck.filter( Boolean ).length }/{ MAIN_DECK_MAX } | Extra Deck: { extraDeck.length }/{ EXTRA_DECK_MAX }
            </p>
            { deckWarnings.length > 0 && (
              <div className="mt-2 text-red-700 font-semibold">
                { deckWarnings.map( ( warning, idx ) => (
                  <p key={ idx }>{ warning }</p>
                ) ) }
              </div>
            ) }
            { statusMessage && (
              <p className="mt-2 text-amber-300 font-semibold">{ statusMessage }</p>
            ) }
            {/* Main Deck */ }
            <div className="mt-4">
              <h3 className="text-xl font-bold">Main Deck</h3>
              <div className="grid grid-cols-8 gap-2 mt-4">
                { deck.map( ( slot, index ) => (
                  <div
                    key={ index }
                    className="relative w-20 h-28 bg-white flex items-center justify-center border border-gray-400 rounded"
                  >
                    { slot ? (
                      <>
                        <Image
                          src={ slot.card_images?.[ 0 ]?.image_url || "/images/backgrounds/yugioh/background.svg" }
                          alt={ slot.name }
                          width={ 80 }
                          height={ 112 }
                          className="rounded w-full h-fit object-scale-down"
                          unoptimized
                        />
                        <button
                          type="button"
                          onClick={ () => removeFromDeck( index ) }
                          className="text-red-700 absolute -top-1 -right-1 text-xl font-black bg-white/80 rounded-full px-1"
                          aria-label={ `Remove ${ slot.name } from deck` }
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-500">Empty</span>
                    ) }
                  </div>
                ) ) }
              </div>
            </div>

            {/* Extra Deck */ }
            <div className="mt-8">
              <h3 className="text-xl font-bold">Extra Deck</h3>
              <div className="grid grid-cols-8 gap-2 mt-2">
                { extraDeck.map( ( card, index ) => (
                  <div
                    key={ card.id ?? `${ card.name }-${ index }` }
                    className="relative w-20 h-28 bg-gray-200 flex flex-col items-center justify-center border border-gray-400 rounded"
                  >
                    <Image
                      src={ card.card_images?.[ 0 ]?.image_url || "/images/backgrounds/yugioh/background.svg" }
                      alt={ card.name }
                      width={ 80 }
                      height={ 112 }
                      className="rounded w-full h-fit object-scale-down"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={ () => removeFromDeck( index, true ) }
                      className="text-red-700 absolute -top-1 -right-1 text-xl font-black bg-white/80 rounded-full px-1"
                      aria-label={ `Remove ${ card.name } from extra deck` }
                    >
                      ×
                    </button>
                  </div>
                ) ) }
              </div>
            </div>
          </div>

          {/* Split Pane: Search and Archetype Suggestions */ }
          <div className="flex flex-col flex-1 gap-2">
            {/* Search Panel */ }
            <div className="flex-1 glass p-4 border-b border-gray-300">
              <h2 className="text-2xl font-bold text-white">Search</h2>
              <div className="mt-4">
                <input
                  type="text"
                  value={ search }
                  onChange={ ( e ) => setSearch( e.target.value ) }
                  placeholder="Search for a card..."
                  className="p-2 border border-gray-300 rounded w-full mb-4"
                />
                <button
                  onClick={ searchCards }
                  className="px-4 py-2 bg-blue-800 text-white rounded hover:bg-blue-600 w-fit"
                >
                  Search
                </button>
              </div>

              { error && <p className="text-red-500 mt-4">{ error }</p> }

              { cards && cards.searchedCard && (
                <div className="mt-4">
                  <h3 className="text-xl font-semibold text-white">Searched Card</h3>
                  <div className="p-4 bg-transparent text-white rounded shadow mb-4">
                    <Image
                      src={ cards.searchedCard.card_images?.[ 0 ]?.image_url || "/images/backgrounds/yugioh/background.svg" }
                      alt={ cards.searchedCard.name }
                      width={ 240 }
                      height={ 320 }
                      className="rounded w-fit h-48 content-around"
                      unoptimized
                    />
                    <p><strong>Name:</strong> { cards.searchedCard.name }</p>
                    <p><strong>Archetype:</strong> { cards.searchedCard.archetype }</p>
                    <p><strong>Text:</strong> { cards.searchedCard.desc }</p>
                    <button
                      onClick={ () => addToDeck( cards.searchedCard ) }
                      className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Add to Deck
                    </button>
                  </div>
                </div>
              ) }
            </div>

            {/* Archetype Suggestions Panel */ }
            <div className="flex-1 glass p-4 ">
              <h2 className="text-2xl font-bold text-white">Archetype Suggestions</h2>
              { archetypeSuggestions && archetypeSuggestions.length > 0 && (
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search within archetype..."
                    value={ searchTerm }
                    onChange={ ( e ) => setSearchTerm( e.target.value ) }
                    className="w-full px-4 py-2 text-black rounded-lg border border-gray-300"
                  />
                </div>
              ) }
              { filteredArchetypeSuggestions && filteredArchetypeSuggestions.length > 0 ? (
                <div className="inline-grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 overflow-y-auto max-h-[400px]">
                  { filteredArchetypeSuggestions.map( ( card, index ) => (
                    <div key={ card.id ?? `${ card.name }-${ index }` } className="w-full rounded bg-white p-3 shadow">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Image
                          src={ card.card_images?.[ 0 ]?.image_url || "/images/backgrounds/yugioh/background.svg" }
                          alt={ card.name }
                          width={ 120 }
                          height={ 160 }
                          className="rounded object-contain"
                          unoptimized
                        />
                        <div className="flex-1 text-gray-800">
                          <p><strong>Name:</strong> { card.name }</p>
                          <p className="text-sm mt-1"><strong className="text-base">Archetype:</strong> { card.archetype }</p>
                          <p className="text-sm mt-1"><strong className="text-base">Text:</strong> { card.desc }</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={ () => addToDeck( card ) }
                        className="mt-3 inline-flex px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add to Deck
                      </button>
                    </div>
                  ) ) }
                </div>
              ) : (
                <p className="text-gray-500 mt-4">No archetype suggestions available.</p>
              ) }
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
