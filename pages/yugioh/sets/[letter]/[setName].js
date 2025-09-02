"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import Breadcrumb from "@/components/Navigation/Breadcrumb";
import Card from "@/components/Yugioh/Card";
import { fetchCardData } from "@/utils/api";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
      const cardsInSet = allCards.filter( ( card ) =>
        card.card_sets?.some(
          ( set ) => set.set_name.toLowerCase() === setName?.toLowerCase()
        )
      );
      setCards( cardsInSet );
    };

    if ( setName ) {
      loadData();
    }

    // ✅ Cookie-based auth check
    const checkAuth = async () => {
      try {
        const res = await fetch( "/api/auth/validate", {
          method: "GET",
          credentials: "include",
        } );
        setIsAuthenticated( res.ok );
      } catch {
        setIsAuthenticated( false );
      }
    };

    checkAuth();
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
    try {
      const { set, condition } = selectedOptions;

      const response = await fetch( `/api/Yugioh/cards`, {
        method: "POST",
        credentials: "include", // ✅ send cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify( {
          cards: [
            {
              productName: selectedCard.name,
              setName: set.set_name,
              number: set.set_code,
              printing: set.set_edition || "Unknown Edition",
              rarity: set.set_rarity,
              condition: condition + " " + ( set.set_edition || "Unknown Edition" ),
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

  return (
    <>
      <Breadcrumb />
      <div>
        <h1 className="my-10 text-xl font-black">
          Cards in { decodeURIComponent( setName || "" ) }
        </h1>
        <div className="container w-full mx-auto gap-6 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          { cards?.map( ( card ) => (
            <div
              key={ card.id }
              className="p-4 rounded shadow transition-transform transform duration-300"
            >
              <Card cardData={ card } as="image" source="set" />
              { isAuthenticated && (
                <button
                  type="button"
                  className="flex mt-2 max-w-fit mx-auto justify-center px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
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
              name="addToCollection"
              onSubmit={ ( e ) => {
                e.preventDefault();
                const formData = new FormData( e.target );
                const selectedSet = JSON.parse( formData.get( "set" ) );
                const selectedCondition = formData.get( "condition" );

                handleAddToCollection( {
                  set: selectedSet,
                  condition: selectedCondition,
                } );
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
                      { set.set_name } - { set.set_rarity } -{ " " }
                      { set.set_edition || "Unknown Edition" } - $
                      { set.set_price || "0.00" }
                    </option>
                  ) ) }
                </select>
              </label>

              <label className="block mb-4">
                Select Condition:
                <select
                  name="condition"
                  className="w-full border rounded p-2 text-black"
                  required
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose a condition
                  </option>
                  <option value="Near Mint">Near Mint</option>
                  <option value="Lightly Played">Lightly Played</option>
                  <option value="Moderately Played">Moderately Played</option>
                  <option value="Heavily Played">Heavily Played</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </label>

              <div className="flex justify-between">
                <button
                  type="button"
                  className="px-4 py-2 bg-red-500 text-white rounded text-shadow font-semibold"
                  onClick={ closeModal }
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded text-shadow font-semibold"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      ) }
      <SpeedInsights />
    </>
  );
};

export default CardsInSetPage;
