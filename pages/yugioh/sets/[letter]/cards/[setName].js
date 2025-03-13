"use client";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import Card from "@/components/Yugioh/Card";
import { fetchCardData } from "@/utils/api";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const CardsInSetPage = () => {
  const [ cards, setCards ] = useState( [] );
  const [ selectedCard, setSelectedCard ] = useState( null );
  const [ modalVisible, setModalVisible ] = useState( false );
  const [ isAuthenticated, setIsAuthenticated ] = useState( false );
  const router = useRouter();
  const { setName } = router.query;

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

    const token = localStorage.getItem( "token" );
    setIsAuthenticated( !!token );
  }, [ setName ] );

  const openModal = ( card ) => {
    setSelectedCard( card );
    setModalVisible( true );
  };

  const closeModal = () => {
    setSelectedCard( null );
    setModalVisible( false );
  };

  return (
    <>
      <Breadcrumb />
      <div>
        <h1 className="my-10 text-xl font-black">Cards in { decodeURIComponent( setName ) }</h1>
        <div className="w-full mx-auto gap-6 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          { cards?.map( ( card ) => (
            <div key={ card.id } className="p-4 border rounded shadow transition-transform transform duration-300">
              <Card cardData={ card } />
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
          </div>
        </div>
      ) }

      <SpeedInsights />
    </>
  );
};

export default CardsInSetPage;
