export const MAIN_DECK_MIN = 40;
export const MAIN_DECK_MAX = 60;
export const EXTRA_DECK_MAX = 15;
const MAX_COPIES = 3;
export type DeckCard = { id: number; name: string; type?: string; [key: string]: unknown };
export type DeckState = {
  deck: (DeckCard | null)[];
  extraDeck: DeckCard[];
  statusMessage: string | null;
};
export const initialDeck: DeckState = {
  deck: Array(MAIN_DECK_MIN).fill(null),
  extraDeck: [],
  statusMessage: null,
};
type Action =
  | { type: 'add'; card: DeckCard }
  | { type: 'remove'; index: number; extra: boolean }
  | { type: 'clear-message' };

export function deckReducer(state: DeckState, action: Action): DeckState {
  if (action.type === 'clear-message') return { ...state, statusMessage: null };
  if (action.type === 'remove')
    return action.extra
      ? {
          ...state,
          extraDeck: state.extraDeck.filter((_, index) => index !== action.index),
          statusMessage: null,
        }
      : {
          ...state,
          deck: state.deck.map((card, index) => (index === action.index ? null : card)),
          statusMessage: null,
        };
  if (/fusion|synchro|xyz|link/i.test(action.card.type || '')) {
    return state.extraDeck.length >= EXTRA_DECK_MAX
      ? { ...state, statusMessage: 'Extra Deck is full. Cannot add more cards.' }
      : { ...state, extraDeck: [...state.extraDeck, action.card], statusMessage: null };
  }
  const empty = state.deck.indexOf(null);
  if (empty < 0 && state.deck.length >= MAIN_DECK_MAX)
    return { ...state, statusMessage: 'Main Deck is full. Cannot add more cards.' };
  const deck = [...state.deck];
  if (empty < 0) deck.push(action.card);
  else deck[empty] = action.card;
  return { ...state, deck, statusMessage: null };
}

export function buildDeckWarnings(deck: DeckState['deck'], extraDeck: DeckCard[]) {
  const warnings: string[] = [];
  const mainCount = deck.filter(Boolean).length;
  if (mainCount < MAIN_DECK_MIN)
    warnings.push(`Main Deck must have at least ${MAIN_DECK_MIN} cards.`);
  if (mainCount > MAIN_DECK_MAX) warnings.push(`Main Deck cannot exceed ${MAIN_DECK_MAX} cards.`);
  if (extraDeck.length > EXTRA_DECK_MAX)
    warnings.push(`Extra Deck cannot exceed ${EXTRA_DECK_MAX} cards.`);
  const counts = new Map<number, number>();
  for (const card of [...deck, ...extraDeck]) {
    if (!card) continue;
    counts.set(card.id, (counts.get(card.id) || 0) + 1);
    if (counts.get(card.id) === MAX_COPIES + 1)
      warnings.push(`${card.name} exceeds the maximum of ${MAX_COPIES} copies allowed.`);
  }
  return warnings;
}
