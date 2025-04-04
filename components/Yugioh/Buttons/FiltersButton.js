import CardFilter from '@/components/Yugioh/CardFilter.js';
import { useState } from 'react';

const FiltersButton = () => {
  const [ isFilterMenuOpen, setIsFilterMenuOpen ] = useState( false );

  const openFilterMenu = () => {
    setIsFilterMenuOpen( true );
  };

  const closeFilterMenu = () => {
    setIsFilterMenuOpen( false );
  };

  return (
    <>
      <button id="filterBtn" onClick={ openFilterMenu }>Filter</button>
      { isFilterMenuOpen && (
        <div id="filterMenu">
          <button id="closeFilterBtn" onClick={ closeFilterMenu }>Close</button>
        </div>
      ) }
    </>
  );
};

export default FiltersButton;
