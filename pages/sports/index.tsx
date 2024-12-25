import React, { useState, useEffect } from 'react';
import { useSportsData } from 'D:/CSVParse/venv/env/card-test/hooks/useSportsData';
import SportsTable from 'D:/CSVParse/venv/env/card-test/components/Sports/SportsTable';
import CardSetSelector from 'D:/CSVParse/venv/env/card-test/components/Sports/CardSetSelector';
import Link from 'next/link';
import Head from 'next/head';
import { CARD_SETS } from 'D:/CSVParse/venv/env/card-test/constants/cardSets';

export default function Home() {
  const [selectedCardSet, setSelectedCardSet] = useState(CARD_SETS[0]);
  const { isLoading, sportsData, dataLoaded, error, fetchData } = useSportsData();

  useEffect(() => {
    fetchData(selectedCardSet, 1);
  }, [selectedCardSet, fetchData]);

  const handleCardSetChange = (cardSet: string) => {
    setSelectedCardSet(cardSet);
  };

  return (
    <>
      <Head>
        <title>Sports Card Collection</title>
        <meta name="description" content="Browse and collect sports cards" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold">Sports Card Browser</h1>
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
              <CardSetSelector 
                value={selectedCardSet}
                onChange={handleCardSetChange}
              />
              <Link
                href="/sports/selected-cards"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
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
    </>
  );
}