import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const CardDetails = () => {
  const router = useRouter();
  const { card } = router.query;
  const [cardData, setCardData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to fetch card data
  const fetchCardData = async (cardId) => {
    try {
      const res = await fetch(`/api/card/${ encodeURIComponent(cardId) }`);
      if (!res.ok) throw new Error('Failed to fetch');
      return await res.json();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!card) return; // Ensure we have a card ID from the query
      setIsLoading(true);
      try {
        const cardDetails = await fetchCardData(card);
        setCardData(cardDetails);
      } catch (error) {
        setError('Error fetching card data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [card]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!cardData) {
    return <div>Card not found</div>;
  }

  return (
    <>
      <div key={cardData.id} className="text-pretty text-white p-6 rounded-md shadow-md mb-8">
        <h1 className="text-2xl font-bold mb-4">{cardData.name}</h1>
        <p className="mb-2"><span className="font-bold">Type:</span> {cardData.type}</p>
        <p className="mb-2 max-w-prose"><span className="font-bold">Description:</span> {cardData.desc}</p>
        <p className="mb-2"><span className="font-bold">Race:</span> {cardData.race}</p>
        <p className="mb-4"><span className="font-bold">Archetype:</span> {cardData.archetype}</p>

        <div className="mb-4 text-pretty">
          <h2 className="text-lg font-bold mb-2">Set Details</h2>
          <ul className="flex flex-col sm:flex-row sm:inline-flex flex-wrap">
            {cardData.card_sets?.map((set, index) => (
              <li key={`${ set.set_code }-${ index }`} className="m-2 p-2 divide-y divide-x divide-x-reverse">
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
    </>
  );
};

export default CardDetails;
