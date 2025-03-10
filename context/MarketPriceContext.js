import { getCardData, updateCardPrices } from '@/utils/api.js';
import { createContext, useCallback, useContext } from 'react';

const MarketPriceContext = createContext();

export const MarketPriceProvider = ({ children }) => {
  const cache = {};

  const fetchMarketPrice = useCallback(async (setName) => {
    if (!setName) {
      console.error('Set name is required');
      return [];
    }

    // Check if the data for the set is already cached
    if (cache.current[setName]) {
      console.log(`Using cached data for set: ${ setName }`);
      return cache.current[setName];
    }

    try {
      const cardData = await getCardData(setName);
      if (cardData && Array.isArray(cardData)) {
        cache.current[setName] = cardData; // Cache the data for the set

        // Save the fetched prices to MongoDB
        await updateCardPrices(setName, cardData);

        return cardData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching market price:', error);
      return [];
    }
  }, []);

  return (
    <MarketPriceContext.Provider value={{ fetchMarketPrice }}>
      {children}
    </MarketPriceContext.Provider>
  );
};

export const useMarketPrice = () => useContext(MarketPriceContext);
