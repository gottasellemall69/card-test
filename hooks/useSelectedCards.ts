// src/hooks/useSelectedCards.ts
import { useState, useCallback } from 'react';
import { Card, SelectedCard } from '@/types/Card';
import { cardStorage } from '@/services/cardStorage';

export const useSelectedCards = () => {
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>(() => {
    if (typeof window !== 'undefined') {
      return cardStorage.loadCards();
    }
    return [];
  });

  const toggleCardSelection = useCallback((card: Card) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id);
      
      if (isSelected) {
        const newCards = prev.filter(c => c.id !== card.id);
        cardStorage.saveCards(newCards);
        return newCards;
      } else {
        const newCard: SelectedCard = {
          ...card,
          dateAdded: new Date().toISOString()
        };
        const newCards = [...prev, newCard];
        cardStorage.saveCards(newCards);
        return newCards;
      }
    });
  }, []);

  const isCardSelected = useCallback((cardId: string) => {
    return selectedCards.some(card => card.id === cardId);
  }, [selectedCards]);

  const removeSelectedCard = useCallback((cardId: string) => {
    setSelectedCards(prev => {
      const newCards = prev.filter(card => card.id !== cardId);
      cardStorage.saveCards(newCards);
      return newCards;
    });
  }, []);

  return {
    selectedCards,
    toggleCardSelection,
    isCardSelected,
    removeSelectedCard
  };
};