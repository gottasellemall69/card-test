// src/components/Sports/TableRow.tsx
import React from 'react';
import { Card } from '@/types/Card';

interface TableRowProps {
  product: Card;
  index: number;
  isSelected: boolean;
  onToggleSelect: (card: Card) => void;
}

const TableRow: React.FC<TableRowProps> = ({
  product,
  index,
  isSelected,
  onToggleSelect
}) => (
  <tr 
    key={product?.id || index}
    className={`${isSelected ? 'bg-blue-900 bg-opacity-20' : ''} hover:bg-gray-700 cursor-pointer`}
    onClick={() => onToggleSelect(product)}
  >
    <td className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm font-medium text-white">
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(product);
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>{product?.productName}</span>
      </div>
    </td>
    <td className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white">
      {product?.consoleUri}
    </td>
    <td className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white">
      {product?.price1}
    </td>
    <td className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm text-white">
      {product?.price3}
    </td>
    <td className="border border-gray-800 p-1 whitespace-wrap break-words text-center sm:text-left text-sm font-medium table-cell">
      {product?.price2}
    </td>
  </tr>
);

export default TableRow;