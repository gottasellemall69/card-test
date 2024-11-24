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
    <div className="glass my-8">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            {['number', 'printing', 'rarity', 'setName', 'condition', 'productName', 'marketPrice', 'quantity', 'status'].map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key)}
                className="p-4 text-left font-bold cursor-pointer hover:text-purple-300 transition-colors whitespace-nowrap"
              >
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')} {getSortArrow(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData?.map((card, index) => (
            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              {Object.entries(card).map(([key, value]) => {
                if (['_id', '__v'].includes(key)) return null;
                return (
                  <td key={key} className="p-4 whitespace-nowrap">
                    {key === 'marketPrice' ? (
                      <div className="flex items-center space-x-2">
                        <span>${value}</span>
                        {index > 0 && (
                          <span className={`ml-2 ${
                            calculatePriceTrend(sortedData[index - 1].marketPrice, value) === '+' 
                              ? 'text-emerald-400' 
                              : 'text-rose-400'
                          }`}>
                            {calculatePriceTrend(sortedData[index - 1].marketPrice, value) === '+' ? '↑' : '↓'}
                            {Math.abs((sortedData[index - 1].marketPrice - value).toFixed(2))}
                          </span>
                        )}
                      </div>
                    ) : (
                      value
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  );
};

export default TableView;