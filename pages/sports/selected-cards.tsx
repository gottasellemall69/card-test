// src/pages/selected-cards.tsx
import React, { useState, useEffect } from 'react';
import { cardStorage } from '@/services/cardStorage';
import { SelectedCard } from '@/types/Card';
import CardGrid from '@/components/Sports/SelectedCards/CardGrid';
import FilterBar from '@/components/Sports/SelectedCards/FilterBar';
import { sortCards } from '@/utils/sortUtils';
import Head from 'next/head';
import Link from 'next/link';

const SelectedCardsPage = () => {
  const [cards, setCards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded-desc');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedCards = cardStorage.loadCards();
      setCards(loadedCards);
    }
  }, []);

  const handleRemoveCard = (cardId: string) => {
    const updatedCards = cards.filter(card => card.id !== cardId);
    setCards(updatedCards);
    cardStorage.saveCards(updatedCards);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleSort = (value: string) => {
    setSortBy(value);
  };

  const filteredCards = cards.filter(card =>
    card.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedCards = sortCards(filteredCards, sortBy);

  return (
    <>
      <Head>
        <title>Selected Cards Collection</title>
        <meta name="description" content="View your selected sports cards collection" />
      </Head>

      <div className="min-h-screen bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Your Card Collection</h1>
            <Link
              href="/sports"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Search
            </Link>
          </div>

          <div className="mb-4">
            <FilterBar
              onSortChange={handleSort}
              onSearch={handleSearch}
              searchTerm={searchTerm}
            />
          </div>

          <div className="bg-gray-800 rounded-lg shadow-xl">
            <CardGrid
              cards={sortedCards}
              onRemoveCard={handleRemoveCard}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SelectedCardsPage;