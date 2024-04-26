'use client';
// @/pages/index.js
import React,{useState} from 'react';

import YugiohCardListInput from '@/components/YugiohCardListInput';
import AlphabeticalIndex from '@/components/AlphabeticalIndex';
import {fetchCardData,setNameIdMap} from '@/utils/api';

const exampleCardList=
  `Nine-Tailed Fox,Duel Power,DUPO-EN031,1st Edition,Ultra Rare,Near Mint 1st Edition
Eidos the Underworld Squire,Brothers of Legend,BROL-EN077,1st Edition,Ultra Rare,Near Mint 1st Edition
Inzektor Exa-Beetle,Brothers of Legend,BROL-EN084,1st Edition,Ultra Rare,Near Mint 1st Edition
Fossil Dig,Brothers of Legend,BROL-EN089,1st Edition,Ultra Rare,Near Mint 1st Edition
Rank-Up-Magic Argent Chaos Force,Brothers of Legend,BROL-EN091,1st Edition,Ultra Rare,Near Mint 1st Edition
Autorokket Dragon,Circuit Break,CIBR-EN010,1st Edition,Super Rare,Near Mint 1st Edition
World Legacy Trap Globe,Circuit Break,CIBR-EN074,1st Edition,Super Rare,Near Mint 1st Edition
Quiet Life,Circuit Break,CIBR-EN096,1st Edition,Super Rare,Near Mint 1st Edition
Parallel Port Armor,Circuit Break,CIBR-ENSE4,Limited,Super Rare,Near Mint Limited
The Terminus of the Burning Abyss,Crossed Souls,CROS-EN085,1st Edition,Ultra Rare,Near Mint 1st Edition
Wind-Up Zenmaines,2012 Collectors Tin,CT09-EN008,Limited,Super Rare,Near Mint Limited`;

const Home=() => {
  const [collection,setCollection]=useState([]);
  const [selectedRows,setSelectedRows]=useState([]);
  const [cardList,setCardList]=useState('');
  const handleLoadExampleData=() => {
    setCardList(exampleCardList);
  };
  const [matchedCardData,setMatchedCardData]=useState(null);
  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState(null);

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
        // Use regular expression to handle escaped commas inside quotation marks
        const regex=/(?:^|,)("(?:[^"]+|"")*"|[^",]+)(?=$|,)/g;
        const matches=cardLine.match(regex);
        if(!matches||matches.length!==6) {
          throw new Error('Invalid card format');
        }
        const [
          rawProductName,
          setName,
          number,
          printing,
          rarity,
          condition
        ]=matches.map((match) => match.replace(/(^,|,$)/g,''));

        // Remove quotation marks around productName if present
        const productName=rawProductName.replace(/^"|"$/g,'');

        return {productName,setName,number,printing,rarity,condition};
      });
      if(cards.length===0) {
        throw new Error('Card list is empty');
      }
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
          card.productName===(productName)&&
          card.set===(setName)&&
          card.number===(number)&&
          card.printing===(printing)&&
          card.rarity===(rarity)&&
          card.condition===(condition)
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
    <div className="max-w-full lg:w-7xl w-fit mx-auto my-24 lg:text-left text-center text-pretty">
      <h1 className="text-4xl font-bold mb-8">Welcome to the thing!</h1>
      <div className="mx-auto container flex flex-wrap flex-col lg:text-left">
        <div className="mx-auto text-base italic font-medium mb-5 lg:text-left">
          Enter a comma-separated (CSV format) list of cards below in the order of [Name][Set][Number][Edition][Rarity][Condition] where the possible conditions are:
          <ul className="my-2 list-none list-outside mx-auto text-sm font-medium lg:text-left">
            <li>Near Mint+[Edition]</li>
            <li>Lightly Played+[Edition]</li>
            <li>Moderately Played+[Edition]</li>
            <li>Heavily Played+[Edition]</li>
            <li>Damaged+[Edition]</li>
          </ul>


          <div className="mx-auto text-base leading-7 italic font-medium text-center lg:text-left">
            Try it out:
            <br />
            <button
              className="my-2 text-sm border border-white rounded-lg px-2 py-2 mx-auto text-white font-bold hover:text-black hover:bg-white"
              onClick={handleLoadExampleData}>
              Load Example Data
            </button>
            <p className="mx-auto text-base leading-7 italic font-medium lg:text-left">
              OR:
            </p>
            <p className="mx-auto text-base leading-7 italic font-medium lg:text-left">
              Browse sets by name by choosing the letter it starts with from the list below:
            </p>
          </div>
        </div>
      </div>
      <div className="m-2 mx-auto w-fit">
        <AlphabeticalIndex />
      </div>

      <YugiohCardListInput
        setSelectedRows={setSelectedRows}
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
  );
};

export default Home;
