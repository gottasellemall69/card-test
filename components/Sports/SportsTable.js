'use client'
import CardSetButtons from '@/components/Sports/Buttons/CardSetButtons';
import SportsCSVButton from '@/components/Sports/Buttons/SportsCSVButton';
import SportsPagination from '@/components/Sports/SportsPagination';
import { useMemo, useState } from 'react';

const SportsTable = ({ sportsData, dataLoaded, setSelectedCardSet, pageSize, startIndex }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  

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

  const flatData = sportsData.flatMap(item => item.products);
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  const sortedData = useMemo(() => {
    return flatData.sort((a, b) => {
      const isNumeric = !isNaN(a[sortConfig.key]) && !isNaN(b[sortConfig.key]);
      if (isNumeric) {
        return sortConfig.direction === 'ascending'
          ? parseFloat(a[sortConfig.key]) - parseFloat(b[sortConfig.key])
          : parseFloat(b[sortConfig.key]) - parseFloat(a[sortConfig.key]);
      } else {
        return sortConfig.direction === 'ascending'
          ? (a[sortConfig.key] || '').localeCompare(b[sortConfig.key] || '')
          : (b[sortConfig.key] || '').localeCompare(a[sortConfig.key] || '');
      }
    });
  }, [flatData, sortConfig]);

  
  const calculateTotalPages = (totalData, pageSize) => {
    return Math.ceil(totalData / pageSize);
  };
  const onPageChange = (page) => {
    setCurrentPage(page);
  };



  const cardsToRender = sortedData.slice(startIndex, startIndex + pageSize);
const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  const totalData = sportsData?.length;
  const totalPages = calculateTotalPages(totalData, pageSize);
  const paginatedData = useMemo(() => {
    if (!sortedData) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);
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
      {paginatedData && (
        <div className="container max-h-[450px] overflow-y-auto w-full">
          <table className="mx-auto mb-2 w-full">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => handleSort('productName')}
                >
                  Name {getSortIcon('productName')}
                </th>
                <th
                  scope="col"
                  className="hidden sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => handleSort('consoleUri')}
                >
                  Set {getSortIcon('consoleUri')}
                </th>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => handleSort('price1')}
                >
                  Ungraded {getSortIcon('price1')}
                </th>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => handleSort('price3')}
                >
                  PSA 9 {getSortIcon('price3')}
                </th>
                <th
                  scope="col"
                  className="sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer"
                  onClick={() => handleSort('price2')}
                >
                  PSA 10 {getSortIcon('price2')}
                </th>
              </tr>
            </thead>
            <tbody className="mx-auto overflow-x-hidden">
            {paginatedData.map((product, index) => (
       <tr key={product?.id || index}>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm font-medium text-white"
                    >
                      {product?.productName}
                    </td>
                    <td
                      scope="row"
                      className="hidden border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white"
                    >
                      {product?.consoleUri}
                    </td>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white"
                    >
                      {product?.price1}
                    </td>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white"
                    >
                      {product?.price3}
                    </td>
                    <td
                      scope="row"
                      className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm font-medium table-cell"
                    >
                      {product?.price2}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {dataLoaded && (
        <div className="mx-auto container w-fit">
          <SportsPagination
          startIndex={startIndex}
            paginatedData={paginatedData}
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
