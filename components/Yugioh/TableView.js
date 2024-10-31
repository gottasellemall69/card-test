import { useMemo, useState } from 'react';

const TableView = ({ aggregatedData }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const calculatePriceTrend = (previousPrice, currentPrice) => {
    if (currentPrice > previousPrice) {
      return '+';
    } else if (currentPrice < previousPrice) {
      return '-';
    } else {
      return '';
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }

    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...aggregatedData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [aggregatedData, sortConfig]);

  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'ascending' ? '▲' : '▼';
  };

  return (<>
    <table className="text-white items-center w-full border-collapse">
      <thead>
        <tr>
          <th onClick={() => handleSort('quantity')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Qty {getSortArrow('quantity')}
          </th>
          <th onClick={() => handleSort('productName')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Name {getSortArrow('productName')}
          </th>
          <th onClick={() => handleSort('setName')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Set {getSortArrow('setName')}
          </th>
          <th onClick={() => handleSort('number')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Number {getSortArrow('number')}
          </th>
          <th onClick={() => handleSort('rarity')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Rarity {getSortArrow('rarity')}
          </th>
          <th onClick={() => handleSort('condition')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Condition {getSortArrow('condition')}
          </th>
          <th onClick={() => handleSort('marketPrice')} className="sticky cursor-pointer top-0 z-10 p-2 border-x-2 border-y-2 border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-sm lg:text-base font-black text-white whitespace-pre backdrop-blur backdrop-filter">
            Price {getSortArrow('marketPrice')}
          </th>
        </tr>
      </thead>
      <tbody className="relative">
        {sortedData?.map((card, index) => (
          <tr key={index}>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.quantity}</td>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.productName}</td>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.setName}</td>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.number}</td>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.rarity}</td>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.condition}</td>
            <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.marketPrice}
              {index > 0 && (
                <div className="rounded inline ml-3 text-lg text-right">
                  {calculatePriceTrend(sortedData[index - 1].marketPrice, card.marketPrice) === '+'
                    ? <span className="text-emerald-500 text-2xl inline">↑</span>
                    : calculatePriceTrend(sortedData[index - 1].marketPrice, card.marketPrice) === '-'
                      ? <span className="text-rose-500 text-2xl inline">↓</span>
                      : <span className="text-gray-500 text-2xl inline"></span>
                  }
                  {Math.abs((sortedData[index - 1].marketPrice - card.marketPrice).toFixed(3))}
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
  );
};

export default TableView;