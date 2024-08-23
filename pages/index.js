'use client';
import AlphabeticalIndex from '@/components/Navigation/AlphabeticalIndex';
import YugiohCardListInput from '@/components/YugiohCardListInput';
import { setNameIdMap } from '@/utils/api';
import Head from 'next/head';
import { useCallback, useMemo, useState } from 'react';

const exampleCardList = `Nine-Tailed Fox,Duel Power,DUPO-EN031,1st Edition,Ultra Rare,Near Mint 1st Edition
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

const Home = () => {
  const [collection, setCollection] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [cardList, setCardList] = useState('');
  const [matchedCardData, setMatchedCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadExampleData = useCallback(() => {
    setCardList(exampleCardList);
  }, []);

  const fetchCardData = useCallback(async (card) => {
    const { productName, setName, number, printing, rarity, condition } = card;
    const setNameId = setNameIdMap[setName];
    if (!setNameId) {
      throw new Error(`Numerical setNameId not found for set name: ${ setName }`);
    }

    try {
      const cachedData = localStorage.getItem(setNameId);
      let setCardData;

      if (cachedData) {
        setCardData = JSON.parse(cachedData);
        console.log(`Using cached set data for: ${ setName }`);
      } else {
        console.log(`Fetching set data for: ${ setName }`);
        const response = await fetch(`/api/cards/${ setNameId }`);
        if (!response.ok) {
          throw new Error(`Failed to fetch card data for set: ${ setName }`);
        }
        setCardData = await response.json();
        localStorage.setItem(setNameId, JSON.stringify(setCardData));
      }

      const matchedCard = setCardData?.result?.find((c) =>
        c.productName.includes(productName) &&
        c.set.includes(setName) &&
        c.number.includes(number) &&
        c.printing.includes(printing) &&
        c.rarity.includes(rarity) &&
        c.condition.includes(condition)
      );

      if (!matchedCard || !matchedCard.marketPrice) {
        throw new Error('Market price data not found for the card');
      }

      return { card, data: { ...matchedCard, marketPrice: matchedCard.marketPrice }, error: null };
    } catch (error) {
      console.error('Error fetching card data:', error);
      return { card, data: { marketPrice: '0.00' }, error: 'No market price available' };
    }
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Check if card list is empty
      if (!cardList.trim()) {
        throw new Error('Card list is empty');
      }

      const cards = cardList.trim().split('\n').map((cardLine) => {
        const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
        const matches = [];
        let match;
        while ((match = regex.exec(cardLine)) !== null) {
          matches.push(match[1] || match[2]);
        }
        if (matches.length !== 6) {
          throw new Error('Invalid card format');
        }

        const [rawProductName, setName, number, printing, rarity, condition] = matches.map((m) => m.trim());
        const productName = rawProductName.replace(/^"|"$/g, '');
        return { productName, setName, number, printing, rarity, condition };
      });

      if (cards.length === 0) {
        throw new Error('Card list is empty');
      }

      const fetchedCardData = await Promise.all(cards.map((card) => fetchCardData(card)));
      setMatchedCardData(fetchedCardData);
    } catch (error) {
      setError(error.message || 'Error fetching card data');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cardList, fetchCardData]);

  const yugiohCardListInputProps = useMemo(() => ({
    collection,
    selectedRows,
    setSelectedRows,
    setCollection,
    cardList,
    setCardList,
    handleSubmit,
    isLoading,
    error,
    matchedCardData,
    setMatchedCardData,
  }), [collection, selectedRows, cardList, isLoading, error, matchedCardData, handleSubmit]);

  return (
    <>
      <Head>
        <title>Card Price App</title>
        <meta name="description" content="Enter list of TCG cards, get data back" />
        <meta name="keywords" content="javascript,nextjs,price-tracker,trading-card-game,tailwindcss" />
        <meta charSet="UTF-8" />
      </Head>
      <div className="my-24 text-pretty">
        <h1 className="text-4xl font-bold mb-8 text-center sm:text-left">Welcome to the thing!</h1>
        <div className="w-full text-base italic font-medium mb-5 text-center sm:text-left">
          Enter a comma-separated (CSV format) list of cards below in the order of [Name][Set][Number][Edition][Rarity][Condition] where the possible conditions are:
          <ul className="w-full my-2 list-none list-outside text-sm font-medium ">
            <li>Near Mint+[Edition]</li>
            <li>Lightly Played+[Edition]</li>
            <li>Moderately Played+[Edition]</li>
            <li>Heavily Played+[Edition]</li>
            <li>Damaged+[Edition]</li>
          </ul>
          <p className="w-full text-base leading-7 italic font-medium">
            Try it out:
            <br />
            <button
              className="my-2 text-sm border border-white rounded-lg px-2 py-2 text-white font-bold hover:text-black hover:bg-white"
              onClick={handleLoadExampleData}>
              Load Example Data
            </button>
            <br />
            OR:
            <br />
            <br />
            Browse sets by name by choosing the letter it starts with from the list below:
          </p>
        </div>
        <div className="m-2 leading-5 w-fit">
          <AlphabeticalIndex />
        </div>
        <div className="flex flex-wrap flex-col">
          <YugiohCardListInput {...yugiohCardListInputProps} />
        </div>
      </div>
    </>
  );
};

export default Home;
