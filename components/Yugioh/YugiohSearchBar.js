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
    <div className="flex items-center justify-center my-8 mx-auto">
      <div className="relative ">
        <input
          id="YugiohSearchBar"
          type="text"
          className="w-full px-6 py-4 glass text-lg placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          placeholder="Search for a card..."
          value={ searchTerm }
          onChange={ handleInputChange }
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={ 2 } d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default YugiohSearchBar;
