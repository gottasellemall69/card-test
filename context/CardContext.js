import { createContext, useContext, useMemo, useState } from 'react';
const CardContext = createContext(null);
export function CardProvider({ children }) {
  const [cards, setCards] = useState([]);
  const value = useMemo(() => ({ cards, setCards }), [cards]);
  return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}
export function useCards() {
  const context = useContext(CardContext);
  if (!context) throw new Error('useCards must be used inside CardProvider');
  return context;
}
