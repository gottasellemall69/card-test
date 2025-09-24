"use client";
import React, { useState, useEffect } from 'react';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { useSportsData } from '@/hooks/useSportsData';
import SportsTable from '@/components/Sports/SportsTable';
import CardSetSelector from '@/components/Sports/CardSetSelector';
import Link from 'next/link';
import Head from 'next/head';
import { CARD_SETS } from '@/constants/cardSets';

export default function Home() {
  const [ selectedCardSet, setSelectedCardSet ] = useState( CARD_SETS[ 0 ] );
  const { isLoading, sportsData, dataLoaded, error, fetchData } = useSportsData();

  useEffect( () => {
    fetchData( selectedCardSet, 1 );
  }, [ selectedCardSet, fetchData ] );

  const handleCardSetChange = ( cardSet: string ) => {
    setSelectedCardSet( cardSet );
  };

  return (
    <>
      <div className="mx-auto min-h-screen w-full">
        <Head>
          <title>Sports Card Collection</title>
          <meta name="description" content="Browse and collect sports cards" />
        </Head>

        <div className="sports-bg text-white mx-auto">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <h1 className="text-3xl font-bold">Sports Card Browser</h1>
              <div className="mx-auto sm:mx-0 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                <CardSetSelector
                  value={selectedCardSet}
                  onChange={handleCardSetChange}
                />
                <Link
                  href="/sports/selected-cards" passHref
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-black hover:text-white transition-colors text-center"
                >
                  View Collection
                </Link>
              </div>
            </div>

            {error && (
              <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
                {error}
              </div>
            )}

            <SportsTable
              sportsData={sportsData}
              dataLoaded={dataLoaded}
              setSelectedCardSet={setSelectedCardSet}
              pageSize={50}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
      <SpeedInsights></SpeedInsights>
    </>
  );
}