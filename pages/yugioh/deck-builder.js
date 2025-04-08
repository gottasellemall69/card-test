import { useState } from "react";

export default function DeckBuilder() {
  const [ search, setSearch ] = useState( "" );
  const [ cards, setCards ] = useState( null );
  const [ deck, setDeck ] = useState( Array( 40 ).fill( null ) );
  const [ extraDeck, setExtraDeck ] = useState( [] );
  const [ error, setError ] = useState( null );
  const [ archetypeSuggestions, setArchetypeSuggestions ] = useState( null );
  const [ deckWarnings, setDeckWarnings ] = useState( [] );
  const [ searchTerm, setSearchTerm ] = useState( "" ); // For archetype filtering

  const searchCards = async () => {
    setError( null );
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
        if ( data.searchedCard?.archetype ) {
          fetchArchetypeSuggestions( data.searchedCard.archetype );
        } else {
          setArchetypeSuggestions( null ); // No archetype, clear suggestions
        }
      }
    } catch ( err ) {
      setError( "Failed to fetch cards" );
    }
  };

  const fetchArchetypeSuggestions = async ( archetype ) => {
    try {
      const response = await fetch(
        `/api/Yugioh/cards/recommendations?archetype=${ encodeURIComponent(
          archetype
        ) }`
      );
      const data = await response.json();

      if ( !response.ok || !data.relatedCards || data.relatedCards.length === 0 ) {
        setArchetypeSuggestions( null ); // No related cards found
      } else {
        setArchetypeSuggestions( data.relatedCards ); // Populate archetype suggestions
      }
    } catch ( err ) {
      console.error( "Failed to fetch archetype suggestions:", err );
      setArchetypeSuggestions( null ); // Handle error gracefully
    }
  };

  const validateDeck = ( deck, extraDeck ) => {
    const warnings = [];
    const mainDeckCount = deck.filter( ( card ) => card !== null ).length;
    const extraDeckCount = extraDeck.length;

    if ( mainDeckCount < 40 )
      warnings.push( "Main Deck must have at least 40 cards." );
    if ( mainDeckCount > 60 )
      warnings.push( "Main Deck cannot exceed 60 cards." );
    if ( extraDeckCount > 15 )
      warnings.push( "Extra Deck cannot exceed 15 cards." );

    const cardCounts = {};
    [ ...deck, ...extraDeck ].forEach( ( card ) => {
      if ( card ) {
        cardCounts[ card.id ] = ( cardCounts[ card.id ] || 0 ) + 1;
        if ( cardCounts[ card.id ] > 3 ) {
          warnings.push( `${ card.name } exceeds the maximum of 3 copies allowed.` );
        }
      }
    } );

    setDeckWarnings( warnings );
  };

  const addToDeck = ( card ) => {
    const deckCopy = [ ...deck ];
    const isExtraDeckType = [ "Fusion", "Synchro", "XYZ", "Link" ].some( ( type ) =>
      card.type.includes( type )
    );

    if ( isExtraDeckType ) {
      if ( extraDeck.length < 15 ) {
        setExtraDeck( ( prevExtraDeck ) => [ ...prevExtraDeck, card ] );
      } else {
        setDeckWarnings( ( prev ) => [
          ...prev,
          "Extra Deck is full. Cannot add more cards.",
        ] );
      }
    } else {
      const emptySlot = deckCopy.findIndex( ( slot ) => slot === null );
      if ( emptySlot !== -1 ) {
        deckCopy[ emptySlot ] = card;
        setDeck( deckCopy );
      } else {
        setDeckWarnings( ( prev ) => [
          ...prev,
          "Main Deck is full. Cannot add more cards.",
        ] );
      }
    }

    validateDeck( deckCopy, extraDeck );
  };

  const removeFromDeck = ( index, isExtraDeck = false ) => {
    if ( isExtraDeck ) {
      const updatedExtraDeck = extraDeck.filter( ( _, i ) => i !== index );
      setExtraDeck( updatedExtraDeck );
      validateDeck( deck, updatedExtraDeck );
    } else {
      const deckCopy = [ ...deck ];
      deckCopy[ index ] = null;
      setDeck( deckCopy );
      validateDeck( deckCopy, extraDeck );
    }
  };

  const filteredArchetypeSuggestions = archetypeSuggestions?.filter( ( card ) =>
    card.name.toLowerCase().includes( searchTerm.toLowerCase() )
  );

  return (
    <div className="p-6 glass min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-4 text-white">Yu-Gi-Oh! Deck Builder</h1>

      <div className="flex flex-1 gap-x-2">
        {/* Deck Panel */ }
        <div className="flex-1 glass p-4 shadow overflow-auto">
          <h2 className="text-2xl font-bold text-white">Deck</h2>
          <p className="text-sm text-white">Main Deck: { deck.filter( ( card ) => card !== null ).length }/60 | Extra Deck: { extraDeck.length }/15</p>
          { deckWarnings.length > 0 && (
            <div className="mt-2 text-red-700 font-semibold">
              { deckWarnings.map( ( warning, idx ) => (
                <p key={ idx }>{ warning }</p>
              ) ) }
            </div>
          ) }
          {/* Main Deck */ }
          <div className="mt-4">
            <h3 className="text-xl font-bold">Main Deck</h3>
            <div className="grid grid-cols-8 gap-2 mt-4">
              { deck.map( ( slot, index ) => (
                <div
                  key={ index }
                  className="w-20 h-28 bg-white flex items-center justify-center border border-gray-400 rounded">
                  { slot ? (
                    <>
                      <img
                        src={ slot.card_images[ 0 ].image_url }
                        alt={ slot.name }
                        width={ 80 }
                        height={ 112 }
                        className="rounded w-full h-fit object-scale-down"
                      />
                      <>
                        <button
                          onClick={ () => removeFromDeck( index ) }
                          className="text-red-700 absolute z-50 text-4xl outline-2 outline-white outline-offset-1  font-black"
                        >
                          X
                        </button>
                      </>
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
                  key={ index }
                  className="w-20 h-28 bg-gray-200 flex flex-col items-center justify-center border border-gray-400 rounded">
                  <img
                    src={ card.card_images[ 0 ].image_url }
                    alt={ card.name }
                    width={ 80 }
                    height={ 112 }
                    className="rounded w-full h-fit object-scale-down"
                  />
                  <button
                    onClick={ () => removeFromDeck( index, true ) }
                    className="text-red-700 absolute z-50 text-4xl outline-2 outline-white outline-offset-1  font-black"
                  >
                    X
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
                  <img
                    src={ cards.searchedCard.card_images[ 0 ].image_url }
                    alt={ cards.searchedCard.name }
                    width={ 240 }
                    height={ 320 }
                    className="rounded w-fit h-48 content-around"
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
                  <>
                    <div key={ ( card.id || index ) } className="w-full p-2 bg-white rounded shadow">
                      <button
                        onClick={ () => addToDeck( card ) }
                        className="mt-4 align-top px-1 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        Add to Deck
                      </button>
                      <img
                        src={ card.card_images[ 0 ].image_url }
                        alt={ card.name }
                        width={ 120 }
                        height={ 160 }
                        className="m-2 rounded w-fit object-contain max-h-48 float-left ..." />

                      <p><strong>Name:</strong> { card.name }</p>
                      <p className="text-sm mt-1"><strong className="text-base">Archetype:</strong> { card.archetype } </p>
                      <p className="text-sm mt-1"><strong className="text-base">Text:</strong> { card.desc }</p>
                    </div>
                  </>

                ) ) }
              </div>
            ) : (
              <p className="text-gray-500 mt-4">No archetype suggestions available.</p>
            ) }
          </div>
        </div>
      </div>
    </div>
  );
}
