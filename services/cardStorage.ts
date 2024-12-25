// src/services/cardStorage.ts
import { SelectedCard } from 'D:/CSVParse/venv/env/card-test/types/Card';

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
      return stored ? JSON.parse(stored) : [];
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
  }
};