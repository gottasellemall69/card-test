'use client';
// @/pages/sets//[letter]/cards/[setName].js
import {useRouter} from 'next/router';
import {useEffect,useState} from 'react';
import {fetchCardData} from '@/utils/api';
import Card from '@/components/Card';

const CardsInSetPage=() => {
  const [cards,setCards]=useState([]);
  const router=useRouter();
  const {setName}=router.query;

  useEffect(() => {
    const loadData=async () => {
      const allCards=await fetchCardData();
      const cardsInSet=allCards.filter(
        (card) => card.card_sets?.some((set) => set.set_name.toLowerCase()===setName.toLowerCase())
      );
      setCards(cardsInSet);
    };

    if(setName) {
      loadData();
    }
  },[setName]);

  return (
    <div>
      <h1 className="my-10 text-xl font-black">Cards in {decodeURIComponent(setName)}</h1>
      <div className="flex-wrap mb-10 min-h-screen max-w-full mx-auto w-11/12 gap-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {cards?.map((card) => (
          <Card
            key={card.id}
            cardData={card}
          />
        ))}
      </div>
    </div>
  );
};

export default CardsInSetPage;
