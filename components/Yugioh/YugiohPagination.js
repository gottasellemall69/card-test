import { useEffect, useState } from 'react';

const YugiohPagination = ( { currentPage, itemsPerPage, totalItems, handlePageClick } ) => {
  const totalPages = Math.ceil( totalItems / itemsPerPage );
  const [ inputPage, setInputPage ] = useState( 0 );

  useEffect( () => {
    setInputPage( currentPage );
  }, [ currentPage ] );

  const handleInputChange = ( e ) => {
    const value = e.target.value;
    if ( value === '' || /^[0-9\b]+$/.test( value ) ) {
      setInputPage( value );
    }
  };

  const handleInputSubmit = () => {
    let pageNumber = parseInt( inputPage, 10 );
    if ( pageNumber >= 1 && pageNumber <= totalPages ) {
      handlePageClick( pageNumber );
    } else if ( pageNumber < 1 ) {
      handlePageClick( 1 );
      setInputPage( 1 );
    } else if ( pageNumber > totalPages ) {
      handlePageClick( totalPages );
      setInputPage( totalPages );
    }
  };

  return (
    <nav className="w-full glass p-4 my-8">
      <div className="flex items-center justify-center space-x-4">
        <button
          type='button'
          onClick={ () => handlePageClick( currentPage - 1 ) }
          disabled={ currentPage === 1 }
          className="px-4 py-2 glass disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent transition-colors"
        >
          Previous
        </button>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={ inputPage }
            onChange={ handleInputChange }
            onBlur={ handleInputSubmit }
            onKeyDown={ ( e ) => e.key === 'Enter' && handleInputSubmit() }
            className="w-16 px-3 py-2 text-center glass"
            aria-label="Page number input"
          />
          <span className="text-white/80">of { totalPages }</span>
        </div>

        <button
          type='button'
          onClick={ () => handlePageClick( currentPage + 1 ) }
          disabled={ currentPage === totalPages }
          className="px-4 py-2 glass disabled:opacity-50 disabled:cursor-not-allowed hover:bg-transparent transition-colors"
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default YugiohPagination;
