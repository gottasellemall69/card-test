"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';

const clampPage = ( value, min, max ) => Math.min( Math.max( value, min ), max );

const YugiohPagination = ( { currentPage = 1, itemsPerPage = 20, totalItems = 0, handlePageClick } ) => {
  const safeItemsPerPage = Math.max( 1, Number( itemsPerPage ) || 1 );
  const totalPages = useMemo(
    () => Math.max( 1, Math.ceil( Number( totalItems ) / safeItemsPerPage ) ),
    [ totalItems, safeItemsPerPage ]
  );

  const [ inputPage, setInputPage ] = useState( String( clampPage( currentPage, 1, totalPages ) ) );

  useEffect( () => {
    setInputPage( String( clampPage( currentPage, 1, totalPages ) ) );
  }, [ currentPage, totalPages ] );

  const triggerPageChange = useCallback( ( nextPage ) => {
    if ( typeof handlePageClick === 'function' ) {
      handlePageClick( clampPage( nextPage, 1, totalPages ) );
    }
  }, [ handlePageClick, totalPages ] );

  const handleInputChange = ( event ) => {
    const { value } = event.target;
    if ( value === '' || /^[0-9\b]+$/.test( value ) ) {
      setInputPage( value );
    }
  };

  const handleInputSubmit = () => {
    if ( inputPage === '' ) {
      setInputPage( String( currentPage ) );
      return;
    }

    const parsedValue = Number( inputPage );
    if ( Number.isNaN( parsedValue ) ) {
      setInputPage( String( currentPage ) );
      return;
    }

    const nextPage = clampPage( parsedValue, 1, totalPages );
    triggerPageChange( nextPage );
    setInputPage( String( nextPage ) );
  };

  const hasMultiplePages = totalPages > 1;

  return (
    <nav className="w-full glass max-w-2xl mx-auto p-4 my-8" aria-label="Card pagination">
      <div className="flex items-center justify-center space-x-4">
        <button
          type="button"
          onClick={ () => triggerPageChange( currentPage - 1 ) }
          disabled={ currentPage <= 1 }
          className="px-4 py-2 glass disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/40 transition-colors"
          aria-label="Go to previous page"
        >
          Previous
        </button>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={ inputPage }
            onChange={ handleInputChange }
            onBlur={ handleInputSubmit }
            onKeyDown={ ( event ) => event.key === 'Enter' && handleInputSubmit() }
            className="w-16 px-3 py-2 text-center text-black text-shadow"
            aria-label="Page number input"
          />
          <span className="text-white/80" aria-live="polite">
            of { totalPages }
          </span>
        </div>

        <button
          type="button"
          onClick={ () => triggerPageChange( currentPage + 1 ) }
          disabled={ !hasMultiplePages || currentPage >= totalPages }
          className="px-4 py-2 glass disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/40 transition-colors"
          aria-label="Go to next page"
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default YugiohPagination;
