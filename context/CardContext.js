// @/context/CardContext.js
import {createContext,useContext,useState} from 'react';

const CardContext=createContext();

export function CardProvider({children}) {
  const [cards,setCards]=useState([]);

  return (
    <CardContext.Provider value={{cards,setCards}}>
      {children}
    </CardContext.Provider>
  );
}

export function useCards() {
  return useContext(CardContext);
}
