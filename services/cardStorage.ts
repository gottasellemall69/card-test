// src/services/cardStorage.ts
import { SelectedCard } from '@/types/Card';

const STORAGE_KEY = 'selectedCards';

export const cardStorage = {
  saveCards: (cards: SelectedCard[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch (error) {
      console.error('Error saving cards:', error);
    }
  },

  loadCards: (): SelectedCard[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed)
        ? parsed.filter(
            (card): card is SelectedCard =>
              !!card && typeof card.id === 'string' && typeof card.productName === 'string',
          )
        : [];
    } catch (error) {
      console.error('Error loading cards:', error);
      return [];
    }
  },

  clearCards: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing cards:', error);
    }
  },
};
