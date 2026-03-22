import { useEffect, useState } from 'react';

const SportsPagination = ( { totalPages, currentPage, onPageChange } ) => {
  // Local state for the input value
  const [ inputValue, setInputValue ] = useState( currentPage.toString() );

  // Synchronize the input value with the current page when the currentPage prop changes
  useEffect( () => {
    setInputValue( currentPage.toString() );
  }, [ currentPage ] );

  const handleInputChange = ( e ) => {
    const value = e.target.value;
    setInputValue( value );

    const page = parseInt( value, 10 );
    // Only update page if input is a valid number and within range
    if ( !isNaN( page ) && page >= 1 && page <= totalPages ) {
      onPageChange( page );
    }
    else {
      onPageChange( 1 );
    }
  };

  const handleInputBlur = () => {
    const page = parseInt( inputValue, 10 );

    // If the input is invalid on blur, reset it to the current page
    if ( isNaN( page ) || page < 1 || page > totalPages ) {
      setInputValue( currentPage.toString() );
    } else {
      onPageChange( page );
    }
  };

  const handleInputKeyPress = ( e ) => {
    if ( e.key === 'Enter' ) {
      const page = parseInt( inputValue, 10 );
      if ( !isNaN( page ) && page >= 1 && page <= totalPages ) {
        onPageChange( page );
      } else {
        setInputValue( currentPage.toString( page ) );
      }
    }
  };

  return (
    <nav className="mt-4 w-full" aria-label="Sports card pagination">
      <ul className="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 px-2 py-2 text-white shadow-2xl backdrop-blur">
        {/* Previous button */ }
        <li className={ `page-item ${ currentPage === 1 ? 'disabled' : '' }` }>
          <button
            onClick={ () => onPageChange( currentPage - 1 ) }
            disabled={ currentPage === 1 }
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
        </li>

        {/* Page input box */ }
        <li className="page-item">
          <input
            type="text"
            value={ inputValue }
            onChange={ handleInputChange }
            onBlur={ handleInputBlur }
            onKeyUp={ handleInputKeyPress }
            className="w-16 rounded-full border border-white/20 bg-black/60 px-3 py-2 text-center text-sm font-semibold text-white focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
            aria-label="Page number input"
          />
        </li>

        <li className="page-item">
          <span className="px-2 py-2 text-sm font-semibold text-white/70">
            / { totalPages }
          </span>
        </li>

        {/* Next button */ }
        <li className={ `page-item ${ currentPage === totalPages ? 'disabled' : '' }` }>
          <button
            onClick={ () => onPageChange( currentPage + 1 ) }
            disabled={ currentPage === totalPages }
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default SportsPagination;
