'use client';
// @/pages/index.js
import React,{useState} from 'react';
import YugiohCardListInput from '@/components/YugiohCardListInput';
import AlphabeticalIndex from "@/components/AlphabeticalIndex";
import {fetchCardData,setNameIdMap} from '@/utils/api';
import {saveCardListToLocalStorage} from '@/utils/localStorage';

const Home=() => {
  const [cardList,setCardList]=useState('');
  const [matchedCardData,setMatchedCardData]=useState(null);
  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState(null);
  const [collection,setCollection]=useState([]);

  const handleSubmit=async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('Form submitted');
    console.log('Card List:',cardList);
    console.log('Is loading:',isLoading);

    try {
      // Split the card list and parse it into JSON
      const cards=cardList.trim().split('\n').map((cardLine) => {
        const [productName,setName,number,printing,rarity,condition]=cardLine?.trim().split(',');
        return {productName,setName,number,printing,rarity,condition};
      });

      // Fetch card data for each card in batches
      const fetchedCardData=await Promise.all(
        cards.map((card) => fetchCardData(card))
      );

      // Filter out null responses
      const validCardData=fetchedCardData.filter((data) => data!==null);

      console.log('Parsed cards:',cards);
      console.log('Fetched card data:',fetchedCardData);
      console.log('Valid card data:',validCardData);

      // Update matched card data
      setMatchedCardData(validCardData);
      saveCardListToLocalStorage(cards);
    } catch(error) {
      setError('Error fetching card data');
      console.error('Error fetching card data:',error);
    } finally {
      setIsLoading(false);
    }
  };


  const fetchedSetData={};

  const fetchCardData=async (card) => {
    try {
      const {productName,setName,number,printing,rarity,condition}=card;
      // Get the numerical setNameId from the mapping
      const setNameId=setNameIdMap[setName];
      if(!setNameId) {
        throw new Error('Numerical setNameId not found for set name:',setName);
      }

      // Check if set data is already fetched
      if(!fetchedSetData[setName]) {
        console.log('Fetching set data for:',setName);
        const response=await fetch(`/api/cards/${setNameId}`);
        if(!response.ok) {
          throw new Error('Failed to fetch card data for set:',setName);
        }
        const responseData=await response.json();
        fetchedSetData[setName]=responseData; // Cache the fetched set data
      } else {
        console.log('Using cached set data for:',setName);
      }

      const setCardData=fetchedSetData[setName];
      // Find the matching card in the fetched set data
      const matchedCard=setCardData?.result.find((card) => {
        return (
          card.productName.includes(productName)&&
          card.set.includes(setName)&&
          card.number.includes(number)&&
          card.printing.includes(printing)&&
          card.rarity.includes(rarity)&&
          card.condition.includes(condition)
        );
      });
      if(!matchedCard||!matchedCard?.marketPrice) {
        throw new Error('Market price data not found for the card');
      }
      const marketPrice=matchedCard?.marketPrice;
      console.log('Matched card:',matchedCard);
      return {card,data: {...matchedCard,marketPrice}};
    } catch(error) {
      console.error('Error fetching card data:',error);
      return null;
    }
  };

  return (
    <>
      <div className="max-w-full lg:w-7xl w-fit mx-auto my-24 text-center text-pretty">
        <h1 className="text-4xl font-bold mb-8">Welcome to the thing!</h1>
        <p className="flex flex-wrap mx-auto text-base italic font-medium mb-5 lg:text-left">
          Enter a comma-separated (CSV format) list of cards below in the order of [Name][Set][Number][Edition][Rarity][Condition] where the possible conditions are:
        </p>
        <ul className="my-2 list-none list-outside mx-auto text-sm font-medium lg:text-left">
          <li>Near Mint+[Edition]</li>
          <li>Lightly Played+[Edition]</li>
          <li>Moderately Played+[Edition]</li>
          <li>Heavily Played+[Edition]</li>
          <li>Damaged+[Edition]</li>
        </ul>
        <p className="mx-auto text-base leading-7 italic font-medium lg:text-left">
          e.g.
        </p>
        <br />
        <ul className="list-none w-11/12 text-sm overflow-x-hidden text-clip max-h-24 overflow-y-scroll mx-auto lg:text-left">
          <li>Nine-Tailed Fox,Duel Power,DUPO-EN031,1st Edition,Ultra Rare,Near Mint 1st Edition</li>
          <li>Eidos the Underworld Squire,Brothers of Legend,BROL-EN077,1st Edition,Ultra Rare,Near Mint 1st Edition</li>
          <li>Inzektor Exa-Beetle,Brothers of Legend,BROL-EN084,1st Edition,Ultra Rare,Near Mint 1st Edition</li>
          <li>Fossil Dig,Brothers of Legend,BROL-EN089,1st Edition,Ultra Rare,Near Mint 1st Edition</li>
          <li>Rank-Up-Magic Argent Chaos Force,Brothers of Legend,BROL-EN091,1st Edition,Ultra Rare,Near Mint 1st Edition</li>
          <li>Autorokket Dragon,Circuit Break,CIBR-EN010,1st Edition,Super Rare,Near Mint 1st Edition</li>
          <li>World Legacy Trap Globe,Circuit Break,CIBR-EN074,1st Edition,Super Rare,Near Mint 1st Edition</li>
          <li>Quiet Life,Circuit Break,CIBR-EN096,1st Edition,Super Rare,Near Mint 1st Edition</li>
          <li>Parallel Port Armor,Circuit Break,CIBR-ENSE4,Limited,Super Rare,Near Mint Limited</li>
          <li>The Terminus of the Burning Abyss,Crossed Souls,CROS-EN085,1st Edition,Ultra Rare,Near Mint 1st Edition</li>
          <li>Wind-Up Zenmaines,2012 Collectors Tin,CT09-EN008,Limited,Super Rare,Near Mint Limited</li>
        </ul>
        <br />
        <p className="mx-auto text-base leading-7 italic font-medium lg:text-left">
          OR:
        </p>
        <br />
        <p className="mx-auto text-base leading-7 italic font-medium lg:text-left">
          Browse sets by name by choosing the letter it starts with from the list below:
        </p>
        <AlphabeticalIndex />
        <YugiohCardListInput
          setCollection={setCollection}
          cardList={cardList}
          setCardList={setCardList}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          matchedCardData={matchedCardData}
          setMatchedCardData={setMatchedCardData}
        />
      </div>
    </>
  );
};

export default Home;
