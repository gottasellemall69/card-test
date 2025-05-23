import React from 'react';
import { SelectedCard } from '@/types/Card';
import { formatDate } from '@/utils/dateUtils';

interface CardGridItemProps {
  card: SelectedCard;
  onRemove: (cardId: string) => void;
}

const CardGridItem: React.FC<CardGridItemProps> = ({ card, onRemove }) => {
  return (
    <div className="bg-transparent glass rounded-lg shadow-lg overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold text-white">{card.productName}</h3>
          <button
            onClick={() => onRemove(card.id)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-100">Set:</div>
            <div className="text-white">{card.consoleUri}</div>
            
            <div className="text-gray-100">Ungraded:</div>
            <div className="text-white">{card.price1}</div>
            
            <div className="text-gray-100">PSA 9:</div>
            <div className="text-white">{card.price3}</div>
            
            <div className="text-gray-100">PSA 10:</div>
            <div className="text-white">{card.price2}</div>
          </div>
          
          <div className="text-xs text-gray-100 mt-2">
            Added: {formatDate(card.dateAdded)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardGridItem;