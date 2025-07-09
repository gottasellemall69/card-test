import { useState, useMemo, useEffect } from 'react';

export const usePagination = <T>( data: T[], itemsPerPage: number ) => {
  const [ currentPage, setCurrentPage ] = useState( 1 );

  const totalPages = Math.max( 1, Math.ceil( data.length / itemsPerPage ) );

  const paginatedData = useMemo( () => {
    const startIndex = ( currentPage - 1 ) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice( startIndex, endIndex );
  }, [ data, currentPage, itemsPerPage ] );

  // ✅ Reset currentPage if data shrinks and currentPage is now invalid
  useEffect( () => {
    if ( currentPage > totalPages ) {
      setCurrentPage( 1 );
    }
  }, [ data, totalPages, currentPage ] );

  const onPageChange = ( page: number ) => {
    if ( page >= 1 && page <= totalPages ) {
      setCurrentPage( page );
    }
  };

  return {
    currentPage,
    paginatedData,
    totalPages,
    onPageChange
  };
};
