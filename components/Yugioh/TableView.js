// components\Yugioh\TableView.js
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
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
        <tbody className="w-full max-h-[450px] overflow-y-auto">
          {sortedData?.map((card, index) => (
            <tr key={index} className="glass transition-colors">
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.quantity}</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.productName}</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.setName}</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.number}</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.rarity}</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.condition}</td>
              <td className="p-2 text-center border-t border-gray-100 text-xs lg:text-sm sm:text-left">{card?.marketPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;