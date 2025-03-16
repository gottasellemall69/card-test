"use client";
import Breadcrumb from '@/components/Navigation/Breadcrumb';
import Card from '@/components/Yugioh/Card';
import { fetchCardData } from '@/utils/api';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';



const CardsInSetPage = () => {
  const [ cards, setCards ] = useState( [] );
  const [ selectedCard, setSelectedCard ] = useState( null );
  const [ modalVisible, setModalVisible ] = useState( false );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const router = useRouter();
  const { card, setName } = router.query;

  useEffect( () => {
    const loadData = async () => {
      const allCards = await fetchCardData();
      const cardsInSet = allCards.filter(
        ( card ) => card.card_sets?.some( ( set ) => set.set_name.toLowerCase() === setName.toLowerCase() )
      );
      setCards( cardsInSet );
    };

    if ( setName ) {
      loadData();
    }

    // Check authentication state
    const token = localStorage.getItem( "token" );
    setIsAuthenticated( !!token );
  }, [ card, setName ] );

  const openModal = ( card ) => {
    setSelectedCard( card );
    setModalVisible( true );
  };

  const closeModal = () => {
    setSelectedCard( null );
    setModalVisible( false );
  };

  const handleAddToCollection = async ( selectedOptions ) => {
    const token = localStorage.getItem( "token" );
    if ( !token ) {
      alert( "Please log in to add cards to your collection." );
      return;
    }

    try {
      const { set, rarity, printing } = selectedOptions;

      const response = await fetch( `/api/Yugioh/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ token }`,
        },
        body: JSON.stringify( {
          cards: [
            {
              productName: selectedCard.name,
              setName: set.set_name,
              number: set.set_code,
              printing: printing || set.set_edition,
              rarity: rarity || set.set_rarity,
              condition: `Near Mint ${ printing }`,
              marketPrice: set.set_price || 0,
              quantity: 1,
            },
          ],
        } ),
      } );

      if ( !response.ok ) {
        throw new Error( "Failed to add card to collection." );
      }

      alert( "Card added to your collection!" );
      closeModal();
    } catch ( error ) {
      console.error( "Error adding card to collection:", error );
      alert( "Failed to add card. Please try again." );
    }
  };

  const handleCardClick = ( cardId ) => {
    setClickedCardId( cardId );
    setTimeout( () => {
      setClickedCardId( null ); // Reset animation after a delay
    }, 300 ); // Match animation duration
  };

  return (
    <>
      <Breadcrumb />
      <div>
        <h1 className="my-10 text-xl font-black">Cards in { decodeURIComponent( setName ) }</h1>
        <div className="w-full mx-auto gap-6 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          { cards?.map( ( card ) => (
            <div
              key={ card.id }
              className={ `p-4 border rounded shadow transition-transform transform duration-300` }
            >
              <Card
                cardData={ card }
              />
              { isAuthenticated && (
                <button
                  className="mt-2 w-full px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
                  onClick={ () => openModal( card ) }
                >
                  Add to Collection
                </button>
              ) }
            </div>
          ) ) }
        </div>
      </div>
      { modalVisible && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="glass p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">{ selectedCard.name }</h2>
            <form
              onSubmit={ ( e ) => {
                e.preventDefault();
                const formData = new FormData( e.target );
                const selectedOptions = {
                  set: JSON.parse( formData.get( "set" ) ),
                  rarity: formData.get( "rarity" ),
                  printing: formData.get( "printing" ),
                };
                handleAddToCollection( selectedOptions );
              } }
            >
              <label className="block mb-2">
                Select Set:
                <select
                  name="set"
                  className="w-full border rounded p-2 text-black"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a set
                  </option>
                  { selectedCard.card_sets?.map( ( set, index ) => (
                    <option key={ index } value={ JSON.stringify( set ) }>
                      { set.set_name } - { set.set_rarity } - { set.set_price }
                    </option>
                  ) ) }
                </select>
              </label>
              <label className="block mb-2">
                Select Rarity:
                <input
                  type="text"
                  name="rarity"
                  className="w-full border rounded p-2"
                  placeholder="Enter rarity"
                />
              </label>
              <label className="block mb-4">
                Select Printing:
                <input
                  type="text"
                  name="printing"
                  className="w-full border rounded p-2"
                  placeholder="Enter printing"
                />
              </label>
              <div className="flex justify-between">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                  onClick={ closeModal }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      ) }
      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default CardsInSetPage;
