// src/components/Sports/SelectedCardsPanel.tsx
import React from 'react';
import { SelectedCard } from '@/types/Card';

interface SelectedCardsPanelProps {
  selectedCards: SelectedCard[];
  onRemoveCard: (cardId: string) => void;
}

const SelectedCardsPanel: React.FC<SelectedCardsPanelProps> = ({
  selectedCards,
  onRemoveCard
}) => {
  if (selectedCards.length === 0) {
    return (
      <div className="p-4 text-center text-white">
        No cards selected
      </div>
    );
  }

  return (
    <div className="bg-transparent rounded-lg p-4 mb-4">
      <h2 className="text-xl font-bold text-white mb-4">Selected Cards</h2>
      <div className="space-y-2">
        {selectedCards.map((card) => (
          <div
            key={card.id}
            className="flex items-center justify-between bg-transparent glass rounded p-2"
          >
            <div className="flex-1">
              <p className="text-white">{card.productName}</p>
              <div className="text-sm text-gray-300 grid grid-cols-3 gap-2">
                <span>Ungraded: {card.price1}</span>
                <span>PSA 9: {card.price3}</span>
                <span>PSA 10: {card.price2}</span>
              </div>
            </div>
            <button
              onClick={() => onRemoveCard(card.id)}
              className="ml-2 px-2 py-1 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedCardsPanel;