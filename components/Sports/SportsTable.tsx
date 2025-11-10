import React from 'react';
import TableHeader from '@/components/Sports/TableHeader';
import { TableRow } from '@/components/Sports/TableComponents/TableRow';
import { useSorting } from '@/hooks/useSorting';
import { usePagination } from '@/hooks/usePagination';
import { useSelectedCards } from '@/hooks/useSelectedCards';
import SportsCSVButton from '@/components/Sports/Buttons/SportsCSVButton';
import SportsPagination from '@/components/Sports/SportsPagination';
import { Card, SportsData } from '@/types/Card';

interface SportsTableProps {
  sportsData: SportsData;
  dataLoaded: boolean;
  setSelectedCardSet?: ( cardSet: string ) => void;
  pageSize: number;
  isLoading: boolean;
}

const formatPrice = ( value: string | number | null | undefined ) => {
  if ( value === null || value === undefined ) {
    return 'N/A';
  }

  if ( typeof value === 'number' ) {
    return `$${ value.toLocaleString( undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    } ) }`;
  }

  const trimmed = String( value ).trim();
  if ( trimmed === '' || trimmed.toLowerCase() === 'null' ) {
    return 'N/A';
  }

  const numericFromString = Number( trimmed.replace( /[^0-9.-]+/g, '' ) );
  if ( !Number.isNaN( numericFromString ) && trimmed !== '' ) {
    return `$${ numericFromString.toLocaleString( undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    } ) }`;
  }

  return trimmed;
};

const SportsTable: React.FC<SportsTableProps> = ( {
  sportsData,
  dataLoaded,
  pageSize,
  isLoading,
} ) => {
  const flatData = React.useMemo<Card[]>( () => {
    if ( !Array.isArray( sportsData ) ) return [];

    return sportsData.flatMap( ( item ) =>
      Array.isArray( item.products )
        ? item.products.map( ( product ) => ( { ...product, id: String( product?.id ?? `${ product?.productName }-${ product?.consoleUri }` ) } ) )
        : [],
    );
  }, [ sportsData ] );

  const { sortedData, handleSort, getSortIcon } = useSorting<Card>( flatData );
  const { currentPage, paginatedData, totalPages, onPageChange } = usePagination( sortedData, pageSize );
  const { toggleCardSelection, isCardSelected } = useSelectedCards();

  const showPagination = dataLoaded && totalPages > 1;
  const renderPagination = () => (
    <SportsPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
  );

  if ( isLoading ) {
    return (
      <div className="mx-auto w-fit py-8 text-center min-h-screen">
        <p className="text-white backdrop glass text-shadow text-2xl px-2 py-4">Loading sports card data...</p>
      </div>
    );
  }

  if ( !isLoading && flatData.length === 0 ) {
    return (
      <div className="w-full py-8 text-center">
        <p className="text-white">No cards available for this set.</p>
      </div>
    );
  }

  return (
    <div className="h-full mx-auto w-full max-w-7xl space-y-6 px-2 sm:px-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SportsCSVButton sportsData={sportsData} />
        {showPagination && <div className="w-fit mx-auto">{renderPagination()}</div>}
      </div>

      <div className="grid gap-4 md:hidden w-[85%] mx-auto">
        {paginatedData.map( ( product, index ) => {
          const isSelected = isCardSelected( product.id );

          return (
            <div
              key={`${ product.id }-${ index }`}
              role="button"
              tabIndex={0}
              onClick={() => toggleCardSelection( product )}
              onKeyDown={( event ) => {
                if ( event.key === 'Enter' || event.key === ' ' ) {
                  event.preventDefault();
                  toggleCardSelection( product );
                }
              }}
              className={`backdrop rounded-2xl border p-4 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-0 ${ isSelected
                ? 'border-indigo-500/60'
                : 'border-white/10'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white/90">{product.productName}</p>
                  <p className="text-sm text-white/60">{product.consoleUri || 'N/A'}</p>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onClick={( event ) => event.stopPropagation()}
                  onChange={() => toggleCardSelection( product )}
                  className="h-5 w-5 rounded border-white/40 bg-transparent text-emerald-400 focus:ring-emerald-400"
                />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/80">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">Ungraded</dt>
                  <dd className="font-semibold text-white">{formatPrice( product.price1 )}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">PSA 9</dt>
                  <dd className="font-semibold text-white">{formatPrice( product.price3 )}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-white/60">PSA 10</dt>
                  <dd className="font-semibold text-white">{formatPrice( product.price2 )}</dd>
                </div>
              </dl>
            </div>
          );
        } )}
      </div>

      <div className="hidden md:block">
        <div className="table-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass text-shadow font-black min-w-full divide-y divide-white/10 text-left text-sm text-white">
              <thead className="bg-transparent backdrop text-xs uppercase tracking-wide text-white/60">
                <tr>
                  <TableHeader title="Name" sortKey="productName" onSort={handleSort} getSortIcon={getSortIcon} />
                  <TableHeader
                    title="Set"
                    sortKey="consoleUri"
                    onSort={handleSort}
                    getSortIcon={getSortIcon}
                    className="hidden lg:table-cell"
                  />
                  <TableHeader title="Ungraded" sortKey="price1" onSort={handleSort} getSortIcon={getSortIcon} />
                  <TableHeader title="PSA 9" sortKey="price3" onSort={handleSort} getSortIcon={getSortIcon} />
                  <TableHeader title="PSA 10" sortKey="price2" onSort={handleSort} getSortIcon={getSortIcon} />
                </tr>
              </thead>
              <tbody className="bg-slate-900/40 text-shadow glass divide-y divide-white/10">
                {paginatedData.map( ( product, index ) => (
                  <TableRow
                    key={`${ product.id }-${ index }`}
                    product={product}
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






