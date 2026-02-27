import { useState, useMemo } from 'react';

export type SortConfig = {
  key: string | null;
  direction: 'ascending' | 'descending';
};

export const useSorting = <T extends Record<string, any>>( data: T[] ) => {
  const [ sortConfig, setSortConfig ] = useState<SortConfig>( {
    key: null,
    direction: 'ascending'
  } );

  const handleSort = ( key: string ) => {
    const isSameKey = sortConfig.key === key;
    const nextDirection =
      isSameKey && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    setSortConfig( { key, direction: nextDirection } );
  };

  const parseNumericValue = ( value: unknown ) => {
    if ( typeof value === 'number' && Number.isFinite( value ) ) {
      return value;
    }

    if ( value === null || value === undefined ) {
      return null;
    }

    const text = String( value ).trim();
    if ( !text ) {
      return null;
    }

    const normalized = text.replace( /[^0-9.-]+/g, '' );
    if ( !normalized || normalized === '-' || normalized === '.' ) {
      return null;
    }

    const parsed = Number( normalized );
    return Number.isFinite( parsed ) ? parsed : null;
  };

  const sortedData = useMemo( () => {
    if ( !sortConfig.key ) return data;

    return [ ...data ].sort( ( a, b ) => {
      const valueA = a[ sortConfig.key! ];
      const valueB = b[ sortConfig.key! ];
      const numericA = parseNumericValue( valueA );
      const numericB = parseNumericValue( valueB );
      const isNumericA = numericA !== null;
      const isNumericB = numericB !== null;

      if ( isNumericA && isNumericB ) {
        return sortConfig.direction === 'ascending'
          ? numericA - numericB
          : numericB - numericA;
      }

      if ( isNumericA && !isNumericB ) return -1;
      if ( !isNumericA && isNumericB ) return 1;

      const result = String( valueA ?? '' ).localeCompare( String( valueB ?? '' ) );
      return sortConfig.direction === 'ascending' ? result : -result;
    } );
  }, [ data, sortConfig ] );

  const getSortIcon = ( key: string ) => {
    if ( sortConfig.key !== key ) return null;
    return sortConfig.direction === 'ascending' ? '^' : 'v';
  };

  return {
    sortedData,
    handleSort,
    getSortIcon
  };
};
