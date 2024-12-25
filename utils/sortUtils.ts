// src/utils/sortUtils.ts
import { SelectedCard } from 'D:/CSVParse/venv/env/card-test/types/Card';

export const sortCards = (cards: SelectedCard[], sortBy: string): SelectedCard[] => {
  const [field, direction] = sortBy.split('-');
  
  return [...cards].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'dateAdded':
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        break;
      case 'name':
        comparison = a.productName.localeCompare(b.productName);
        break;
      case 'price':
        const priceA = parseFloat(a.price2.replace(/[^0-9.-]+/g, '')) || 0;
        const priceB = parseFloat(b.price2.replace(/[^0-9.-]+/g, '')) || 0;
        comparison = priceA - priceB;
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
};