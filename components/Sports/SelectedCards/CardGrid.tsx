// src/components/SelectedCards/CardGrid.tsx
import React from 'react';
import { SelectedCard } from '@/types/Card';
import CardGridItem from '@/components/Sports/SelectedCards/CardGridItem';

interface CardGridProps {
  cards: SelectedCard[];
  onRemoveCard: (cardId: string) => void;
}

const CardGrid: React.FC<CardGridProps> = ({ cards, onRemoveCard }) => {
  if (cards.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-300 text-lg">No cards selected yet</p>
        <p className="text-gray-400 mt-2">Select cards from the main table to add them to your collection</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {cards.map((card) => (
        <CardGridItem key={card.id} card={card} onRemove={onRemoveCard} />
      ))}
    </div>
  );
};

export default CardGrid;