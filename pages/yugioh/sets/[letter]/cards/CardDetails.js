"use client"
import Breadcrumb from '@/components/Navigation/Breadcrumb';
import { SpeedInsights } from "@vercel/speed-insights/next";
import Link from 'next/link';
import { useRouter } from 'next/router';
import useSWR from 'swr';



const fetcher = (url) => fetch(url).then((res) => {
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
});

const CardDetails = () => {
  const router = useRouter();
  const { card, letter, setName } = router.query;

  // Use SWR for data fetching with the card ID
  const { data: cardData, error } = useSWR(
    card ? `/api/Yugioh/card/${ encodeURIComponent(card) }` : null,
    fetcher
  );

  if (error) {
    return <div>Error loading card data.</div>;
  }

  if (!cardData) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Breadcrumb>
        <Link
          href="/yugioh" passHref
        >
          Alphabetical Index
        </Link>
        <Link
          href={"/yugioh/sets/[letter]"} passHref
          as={`/yugioh/${ letter }/sets`}
        >
          Sets by Letter: {letter}
        </Link>
        <Link
          href={"/yugioh/sets/[letter]/cards/[setName]"} passHref
          as={`/yugioh/sets/${letter}/cards/${setName}`}
        >
          Cards in Set: {setName}
        </Link> 
        <div>
          <p>
            <span className='text-black'>
              Card Details: {cardData.name}
            </span>
          </p>
        </div>
      </Breadcrumb>

      <div key={cardData.id} className="text-pretty text-white p-6 rounded-md shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-4">{cardData.name}</h1>
        <p className="mb-2">
          <span className="font-bold">Type:</span> {cardData.type}
        </p>
        <p className="mb-2 max-w-prose">
          <span className="font-bold">Description:</span> {cardData.desc}
        </p>
        <p className="mb-2">
          <span className="font-bold">Race:</span> {cardData.race}
        </p>
        <p className="mb-4">
          <span className="font-bold">Archetype:</span> {cardData.archetype}
        </p>
        <div className="mb-4 text-pretty">
          <h2 className="text-lg font-bold mb-2">Set Details</h2>
          <ul className="flex flex-col sm:flex-row sm:inline-flex flex-wrap">
            {cardData.card_sets?.map((set, index) => (
              <li key={`${ set.set_code }-${ index }`} className="m-2 p-2 divide-y divide-x-reverse">
                <p><span className="font-bold">Card Number:</span> {set.set_code}</p>
                <p><span className="font-bold">Set Name:</span> {set.set_name}</p>
                <p><span className="font-bold">Rarity:</span> {set.set_rarity}</p>
                <p><span className="font-bold">Edition:</span> {set.set_edition}</p>
                <p><span className="font-bold">Price:</span> {set.set_price}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-2">Card Prices</h2>
          <p><span className="font-bold">Cardmarket Price:</span> {cardData.card_prices?.cardmarket_price}</p>
          <p><span className="font-bold">TCGPlayer Price:</span> {cardData.card_prices?.tcgplayer_price}</p>
          <p><span className="font-bold">eBay Price:</span> {cardData.card_prices?.ebay_price}</p>
          <p><span className="font-bold">Amazon Price:</span> {cardData.card_prices?.amazon_price}</p>
          <p><span className="font-bold">Coolstuffinc Price:</span> {cardData.card_prices?.coolstuffinc_price}</p>
        </div>
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
};

export default CardDetails;
