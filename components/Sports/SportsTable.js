import CardSetButtons from '@/components/Sports/Buttons/CardSetButtons';
import SportsCSVButton from '@/components/Sports/Buttons/SportsCSVButton';
import SportsPagination from '@/components/Sports/SportsPagination';
import { useMemo, useState } from 'react';

const SportsTable = ({ sportsData, dataLoaded, setSelectedCardSet, currentPage, setCurrentPage, pageSize }) => {
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'ascending' });
  const memoizedCardSets = useMemo(() => [
    '1975 NBA Topps',
    '1989 NBA Hoops',
    '1990 NBA Hoops',
    '1990 NBA Skybox',
    '1990 NBA Fleer',
    '1991 NBA Fleer',
    '1991 NBA Hoops',
    '1991 NBA Upper Deck',
    '1991 NFL Fleer',
    '1991 NFL Upper Deck',
    '1991 NFL Pro Set',
    '1991 NFL Proline Portraits',
    '1991 NFL Wild Card College Draft Picks',
    '1991 NFL Wild Card',
    '1989 MLB Topps',
    '1989 MLB SCORE',
    '1989 MLB Donruss',
    '1989 MLB Fleer',
    '1991 MLB Donruss',
    '1991 MLB SCORE',
    '1991 MLB Fleer'
  ], []);

  const calculateTotalPages = (totalData, pageSize) => {
    return Math.ceil(totalData / pageSize);
  };

  const totalData = sportsData?.length;
  const totalPages = calculateTotalPages(totalData, pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const sortedData = [...sportsData].sort((a, b) => {
    if (sortConfig.key) {
      const isNumeric = !isNaN(a[sortConfig.key]) && !isNaN(b[sortConfig.key]);
      if (isNumeric) {
        return sortConfig.direction === 'ascending'
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      } else {
        return sortConfig.direction === 'ascending'
          ? a[sortConfig.key] - b[sortConfig.key]
          : b[sortConfig.key] - a[sortConfig.key];
      }
    }
    return 0;
  });
  const cardsToRender = sortedData.slice(startIndex, startIndex + pageSize);

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  const onSortChange = (key) => {
    let direction = 'ascending';
    if (
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (
    <div className="max-w-7xl w-full mx-auto">
      <div className="w-fit inline-flex flex-wrap flex-row place-content-stretch align-middle justify-stretch">
        <div className="w-full float-start text-black font-black">
          <CardSetButtons
            cardSets={memoizedCardSets}
            onSelectCardSet={setSelectedCardSet}
          />
        </div>

        <div className="w-full align-baseline float-start">
          <SportsCSVButton sportsData={sportsData} />
        </div>
      </div>
      {cardsToRender && (
        <div className="container max-h-[550px] overflow-y-auto w-full">
          <table className="mx-auto mb-2 w-full">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => onSortChange('productName')}
                >
                  Name {getSortIcon('productName')}
                </th>
                <th
                  scope="col"
                  className="hidden sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => onSortChange('consoleUri')}
                >
                  Set {getSortIcon('consoleUri')}
                </th>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => onSortChange('price1')}
                >
                  Ungraded {getSortIcon('price1')}
                </th>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => onSortChange('price3')}
                >
                  PSA 9 {getSortIcon('price3')}
                </th>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => onSortChange('price2')}
                >
                  PSA 10 {getSortIcon('price2')}
                </th>
              </tr>
            </thead>
            <tbody className="mx-auto overflow-x-hidden">
              {cardsToRender?.map((item, index) =>
                item.products?.map((product, productIndex) => (
                  <tr key={`${ index }-${ productIndex }`}>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm font-medium text-white"
                    >
                      {product['productName']}
                    </td>
                    <td
                      scope="row"
                      className="hidden border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white"
                    >
                      {product['consoleUri']}
                    </td>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white"
                    >
                      {product['price1']}
                    </td>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white"
                    >
                      {product['price3']}
                    </td>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm font-medium table-cell"
                    >
                      {product['price2']}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {dataLoaded && (
        <div className="mx-auto container w-fit">
          <SportsPagination
            pageSize={pageSize}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            calculateTotalPages={calculateTotalPages}
          />
        </div>
      )}
    </div>
  );
};

export default SportsTable;
