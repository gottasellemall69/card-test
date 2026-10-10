import { useState, useCallback, useEffect } from 'react';
import type { Card, SelectedCard } from '@/types/Card';
import { cardStorage } from '@/services/cardStorage';
export const useSelectedCards = () => {
  // The first client render matches SSR; storage is read only after hydration.
  const [selectedCards, setSelectedCards] = useState<SelectedCard[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setSelectedCards(cardStorage.loadCards());
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) cardStorage.saveCards(selectedCards);
  }, [selectedCards, ready]);
  const toggleCardSelection = useCallback((card: Card) => {
    const dateAdded = new Date().toISOString();
    setSelectedCards((previous) =>
      previous.some((item) => item.id === card.id)
        ? previous.filter((item) => item.id !== card.id)
        : [...previous, { ...card, dateAdded }],
    );
  }, []);
  const isCardSelected = useCallback(
    (id: string) => selectedCards.some((card) => card.id === id),
    [selectedCards],
  );
  const removeSelectedCard = useCallback(
    (id: string) => setSelectedCards((previous) => previous.filter((card) => card.id !== id)),
    [],
  );
  return { selectedCards, toggleCardSelection, isCardSelected, removeSelectedCard };
};
