'use client';
import { memo, useMemo, useState } from 'react';

const TableView = memo(({ aggregatedData }) => {
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

  return (
    <div className="grid grid-cols-1 gap-6 mb-6">
      <div className="p-6 relative flex flex-col min-w-0 mb-4 lg:mb-0 break-words w-full rounded">
        <div className="rounded-t mb-0 px-0 border-0">
          <div className="block w-full overflow-x-auto max-h-[750px] overflow-y-auto">
            <table className="text-white items-center w-full border-collapse">
              <thead>
                <tr>
                  <th onClick={() => handleSort('quantity')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Qty
                  </th>
                  <th onClick={() => handleSort('productName')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Name
                  </th>
                  <th onClick={() => handleSort('setName')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Set
                  </th>
                  <th onClick={() => handleSort('number')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg                     font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Number
                  </th>
                  <th onClick={() => handleSort('rarity')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Rarity
                  </th>
                  <th onClick={() => handleSort('condition')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Condition
                  </th>
                  <th onClick={() => handleSort('marketPrice')} className="sticky cursor-pointer top-0 z-10 py-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 outline-1 outline-black text-center text-shadow text-lg font-black text-white whitespace-pre backdrop-blur backdrop-filter">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="relative">
                {sortedData?.map((card, index) => (
                  <tr key={index}>
                    <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.quantity}</td>
                    <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.productName}</td>
                    <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.setName}</td>
                    <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.number}</td>
                    <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.rarity}</td>
                    <td className="p-2 text-center border-t border-gray-100 text-sm">{card?.condition}</td>
                    <td className="p-2 text-center border-t border-gray-100 text-sm sm:text-left">{card?.marketPrice}
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
          </div>
        </div>
      </div>
    </div>
  );
});

export default TableView;