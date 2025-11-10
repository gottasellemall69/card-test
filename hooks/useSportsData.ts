import useSWR from 'swr';
import type { SportsData } from '@/types/Card';

const buildApiBasePath = () => {
  const basePath = process.env.NEXT_PUBLIC_API_URL;

  if (!basePath) {
    return '/api';
  }

  if (basePath.startsWith('http')) {
    return basePath.replace(/\/$/, '');
  }

  const trimmed = basePath.replace(/^\/|\/$/g, '');
  return trimmed ? `/${trimmed}` : '';
};

const API_BASE_PATH = buildApiBasePath();

const fetchSportsData = async (cardSet: string): Promise<SportsData> => {
  const params = new URLSearchParams({ cardSet });
  const url = `${API_BASE_PATH}/Sports/sportsData?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load sports data (status ${response.status})`);
  }

  return response.json();
};

type SportsDataKey = readonly [ 'sportsData', string ];

export const useSportsData = (cardSet: string | null) => {
  const shouldFetch = Boolean(cardSet);
  const swrKey: SportsDataKey | null = shouldFetch && cardSet ? [ 'sportsData', cardSet ] : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<SportsData>(
    swrKey,
    ( [ , currentSet ]: SportsDataKey ) => fetchSportsData( currentSet ),
    {
      revalidateOnFocus: false,
    }
  );

  const normalizedData = data ?? [];
  const normalizedError = error instanceof Error ? error.message : null;

  return {
    isLoading: Boolean( isLoading ),
    isValidating,
    sportsData: normalizedData,
    dataLoaded: shouldFetch && ( !!data || !!normalizedError ) && !isLoading,
    error: normalizedError,
    refresh: () => mutate(),
  };
};
