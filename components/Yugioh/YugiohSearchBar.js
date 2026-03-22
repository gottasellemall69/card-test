"use client";
import { useState } from 'react';

const YugiohSearchBar = ( { onSearch } ) => {
  const [ searchTerm, setSearchTerm ] = useState( '' );


  const handleInputChange = async ( event ) => {
    const value = event.target.value;
    setSearchTerm( value );
    if ( value === '' ) {
      onSearch( '' );
    }
    onSearch( value );
  };

  return (
    <div className="w-full">
      <label htmlFor="YugiohSearchBar" className="sr-only">Search cards</label>
      <div className="relative">
        <input
          id="YugiohSearchBar"
          type="text"
          className="w-full rounded-2xl border border-white/10 bg-black/60 py-3 pl-12 pr-4 text-base text-white placeholder-white/50 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
          placeholder="Search by card name, set, rarity, or number..."
          value={ searchTerm }
          onChange={ handleInputChange }
        />
        <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
          <svg className="h-5 w-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default YugiohSearchBar;
