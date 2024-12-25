import { useState, useMemo } from 'react';

export type SortConfig = {
  key: string | null;
  direction: 'ascending' | 'descending';
};

export const useSorting = <T extends Record<string, any>>(data: T[]) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: null, 
    direction: 'ascending' 
  });

  const handleSort = (key: string) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig( {key, direction: null});
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const valueA = a[sortConfig.key!];
      const valueB = b[sortConfig.key!];
  
      const isNumericA = !isNaN(parseFloat(valueA));
      const isNumericB = !isNaN(parseFloat(valueB));
  
      if (isNumericA && isNumericB) {
        const numericA = parseFloat(valueA);
        const numericB = parseFloat(valueB);
        return sortConfig.direction === 'ascending' 
          ? numericA - numericB 
          : numericB - numericA;
      }
      
      if (isNumericA) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (isNumericB) return sortConfig.direction === 'ascending' ? 1 : -1;
      
      const result = String(valueA || '').localeCompare(String(valueB || ''));
      return sortConfig.direction === 'ascending' ? result : -result;
    });
  }, [data, sortConfig]);

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return {
    sortedData,
    handleSort,
    getSortIcon
  };
};