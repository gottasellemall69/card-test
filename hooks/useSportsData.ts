import React, { useState, useCallback } from 'react';

export const useSportsData = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [sportsData, setSportsData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (cardSet: string, page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/${ process.env.NEXT_PUBLIC_API_URL }/Sports/sportsData?cardSet=${encodeURIComponent(cardSet)}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const data = await response.json();
      setSportsData(data);
      setDataLoaded(true);
    } catch (err: any) {
      setError(err.message);
      setSportsData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    sportsData,
    dataLoaded,
    error,
    fetchData,
  };
};