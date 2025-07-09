import React from 'react';
import TableHeader from '@/components/Sports/TableHeader';
import { TableRow } from '@/components/Sports/TableComponents/TableRow';
import { useSorting } from '@/hooks/useSorting';
import { usePagination } from '@/hooks/usePagination';
import { useSelectedCards } from '@/hooks/useSelectedCards';
import SportsCSVButton from '@/components/Sports/Buttons/SportsCSVButton';
import SportsPagination from '@/components/Sports/SportsPagination';
import { Card } from '@/types/Card';

interface SportsTableProps {
  sportsData: any[];
  dataLoaded: boolean;
  setSelectedCardSet: ( cardSet: string ) => void;
  pageSize: number;
  isLoading: boolean;
}

const SportsTable: React.FC<SportsTableProps> = ( {
  sportsData,
  dataLoaded,
  pageSize,
  isLoading
} ) => {
  // Transform data
  const flatData = React.useMemo( () => {
    if ( !Array.isArray( sportsData ) ) return [];
    return sportsData.flatMap( item =>
      Array.isArray( item.products ) ? item.products.map( ( product: { id: any; productName: any; consoleUri: any; } ) => ( {
        ...product,
        id: product.id || `${ product.productName }-${ product.consoleUri }`
      } ) ) : []
    );
  }, [ sportsData ] );

  const { sortedData, handleSort, getSortIcon } = useSorting<Card>( flatData );
  const { currentPage, paginatedData, totalPages, onPageChange } = usePagination( sortedData, pageSize );
  const { toggleCardSelection, isCardSelected } = useSelectedCards();

  // Loading state
  if ( isLoading ) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-white">Loading sports card data...</p>
      </div>
    );
  }

  // Empty data state
  if ( !isLoading && flatData.length === 0 ) {
    return (
      <div className="w-full text-center py-8">
        <p className="text-white">No cards available for this set.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto">
      <div className="grid grid-cols-1 gap-4">
        <div className="w-full">
          <div className="w-full align-baseline float-start">
            <SportsCSVButton sportsData={sportsData} />
          </div>
          {dataLoaded && totalPages > 1 && (
            <div className="mx-auto container max-w-7xl place-content-evenly">
              <SportsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            </div>
          )}
          <div className="container h-fit max-h-[750px] overflow-y-auto w-full mx-auto">
            <table className="mx-auto mb-2 w-full">
              <thead>
                <tr>
                  <TableHeader
                    title="Name"
                    sortKey="productName"
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <TableHeader
                    title="Set"
                    sortKey="consoleUri"
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    className="md:table-cell"
                  />
                  <TableHeader
                    title="Ungraded"
                    sortKey="price1"
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <TableHeader
                    title="PSA 9"
                    sortKey="price3"
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                  <TableHeader
                    title="PSA 10"
                    sortKey="price2"
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                  />
                </tr>
              </thead>
              <tbody className="mx-auto overflow-x-hidden">
                {paginatedData.map( ( product: Card, index: number ) => (
                  <TableRow
                    key={product.id || index}
                    product={product}
                    index={index}
                    isSelected={isCardSelected( product.id )}
                    onToggleSelect={toggleCardSelection}
                  />
                ) )}
              </tbody>
            </table>
          </div>


        </div>
      </div>
    </div>
  );
};

export default SportsTable;