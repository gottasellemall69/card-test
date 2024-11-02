import AlphabeticalIndex from '@/components/Yugioh/AlphabeticalIndex';
import dynamic from 'next/dynamic';
const YugiohCardListInput = dynamic(() => import('@/components/Yugioh/YugiohCardListInput'), { ssr: false });
const YugiohCardDataTable = dynamic(() => import('@/components/Yugioh/YugiohCardDataTable'), { ssr: false });
import { SpeedInsights } from "@vercel/speed-insights/next";
import Head from 'next/head';
import { useState, useCallback, useEffect } from 'react';

// Example card list data
const exampleCardList =
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

const Home = () => {
  const [collection, setCollection] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [cardList, setCardList] = useState([]);
  const [matchedCardData, setMatchedCardData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadExampleData = () => {
    setCardList(exampleCardList);
  };

  const fetchedSetData = {};
  const [setNameIdMap, setSetNameIdMap] = useState({});

  // Fetch setNameIdMap from the endpoint once on component mount
  useEffect(() => {
    const fetchSetNameIdMap = async () => {
      try {
        const response = await fetch('/api/Yugioh/setNameIdMap');
        const data = await response.json();
        setSetNameIdMap(data);
      } catch (error) {
        console.error("Failed to fetch setNameIdMap:", error);
      }
    };
    fetchSetNameIdMap();
  }, []);

  const fetchCardData = useCallback(async(card) => {
    try {
      const { productName, setName, number, printing, rarity, condition } = card;
      const setNameId = setNameIdMap[setName];
      if (!setNameId) {
        throw new Error(`Numerical setNameId not found for set name: ${setName}`);
      }

      if (!fetchedSetData[setNameId]) {
        console.log('Fetching set data for ID:', setNameId);
        const response = await fetch(`/api/Yugioh/cards/${setNameId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch card data for set ID: ${setNameId}`);
        }
        const responseData = await response.json();
        fetchedSetData[setNameId] = responseData;
      } else {
        console.log('Using cached set data for ID:', setNameId);
      }
      const setCardData = fetchedSetData[setNameId];

      const matchedCard = setCardData?.result.find((card) => {
        return (
          card.productName.includes(productName) &&
          card.set.includes(setName) &&
          card.number.includes(number) &&
          card.printing.includes(printing) &&
          card.rarity.includes(rarity) &&
          card.condition.includes(condition)
        );
      });

      if (!matchedCard || !matchedCard?.marketPrice) {
        throw new Error('Market price data not found for the card');
      }
      const marketPrice = matchedCard?.marketPrice !== undefined ? matchedCard.marketPrice : parseFloat("0").toFixed(2);
      console.log('Matched card:', matchedCard);
      return { card, data: { ...matchedCard, marketPrice }, error: null };
    } catch (error) {
      console.error('Error fetching card data:', error);
      return { card, data: { marketPrice: parseFloat("0").toFixed(2) }, error: 'No market price available' };
    }
  }, [setNameIdMap]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('Form submitted');
    console.log('Card List:', cardList);
    console.log('Is loading:', isLoading);

    try {
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
        const [rawProductName, setName, number, printing, rarity, condition] = matches.map((match) => match.trim());
        const productName = rawProductName.replace(/^"|"$/g, '');
        return { productName, setName, number, printing, rarity, condition };
      });

      if (cards.length === 0) {
        throw new Error('Card list is empty');
      }

      const fetchedCardData = await Promise.all(cards.map((card) => fetchCardData(card)));
      console.log('Parsed cards:', cards);
      console.log('Fetched card data:', fetchedCardData);
      setMatchedCardData(fetchedCardData);
    } catch (error) {
      setError('Error fetching card data');
      console.error('Error fetching card data:', error);
    } finally {
      setIsLoading(false);
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
      <div className="">
        <h1 className="text-4xl font-bold mb-8 text-center sm:text-left">Welcome to the thing!</h1>
        <details className="">
          Enter a comma-separated (CSV format) list of cards below in the order of [Name][Set][Number][Edition][Rarity][Condition] where the possible conditions are:
          <ul className="">
            <li>Near Mint+[Edition]</li>
            <li>Lightly Played+[Edition]</li>
            <li>Moderately Played+[Edition]</li>
            <li>Heavily Played+[Edition]</li>
            <li>Damaged+[Edition]</li>
          </ul>
        </details>
        <div className="">
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
          Browse sets by name by choosing the letter it starts with from the list below:
        </div>

        <div className="leading-5">
          <AlphabeticalIndex />
        </div>
        <div className="">
          <YugiohCardListInput
            collection={collection}
            selectedRows={selectedRows}
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
        <div className="">
          <YugiohCardDataTable
            matchedCardData={matchedCardData}
            setMatchedCardData={setMatchedCardData}
          />
        </div>
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
}

export default Home;
