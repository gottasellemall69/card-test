// src/types/Card.ts
export interface Card {
  id: string;
  productName: string;
  consoleUri: string;
  price1: string; // Ungraded
  price2: string; // PSA 10
  price3: string; // PSA 9
  selected?: boolean;
}

export interface SelectedCard extends Card {
  dateAdded: string;
  userId?: string;
}

export interface SportsDataItem {
  products: Card[];
  [key: string]: any;
}

export interface SportsData extends Array<SportsDataItem> {}