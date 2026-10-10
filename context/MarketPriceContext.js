import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { getCardData } from '@/utils/api';
const MarketPriceContext = createContext(null);
export function MarketPriceProvider({ children }) {
  const cache = useRef(new Map());
  const fetchMarketPrice = useCallback(async (setName) => {
    if (!setName) return [];
    const old = cache.current.get(setName);
    if (old && old.expires > Date.now()) return old.promise;
    const promise = getCardData(setName)
      .then((data) => (Array.isArray(data) ? data : data?.result || data?.results || []))
      .catch((error) => {
        cache.current.delete(setName);
        throw error;
      });
    cache.current.set(setName, { promise, expires: Date.now() + 300000 });
    return promise;
  }, []);
  const value = useMemo(() => ({ fetchMarketPrice }), [fetchMarketPrice]);
  return <MarketPriceContext.Provider value={value}>{children}</MarketPriceContext.Provider>;
}
export function useMarketPrice() {
  const context = useContext(MarketPriceContext);
  if (!context) throw new Error('useMarketPrice must be used inside MarketPriceProvider');
  return context;
}
