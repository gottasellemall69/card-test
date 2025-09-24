import React from 'react';
import { Card } from '@/types/Card';

interface TableRowProps {
  product: Card;
  isSelected: boolean;
  onToggleSelect: (card: Card) => void;
}

const formatPrice = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  if (typeof value === 'number') {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  const trimmed = String(value).trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') {
    return 'N/A';
  }

  const numericFromString = Number(trimmed.replace(/[^0-9.-]+/g, ''));
  if (!Number.isNaN(numericFromString) && trimmed !== '') {
    return `$${numericFromString.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return trimmed;
};

export const TableRow: React.FC<TableRowProps> = ({
  product,
  isSelected,
  onToggleSelect,
}) => (
  <tr
    className={`cursor-pointer transition-colors hover:bg-white/5 ${
      isSelected ? 'bg-indigo-500/10' : 'bg-transparent'
    }`}
    onClick={() => onToggleSelect(product)}
  >
    <td data-label="Name" className="align-middle px-4 py-3 text-sm text-white">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(event) => {
            event.stopPropagation();
            onToggleSelect(product);
          }}
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 rounded border-white/40 bg-transparent text-emerald-400 focus:ring-emerald-400"
        />
        <span className="font-medium text-white/90">{product?.productName}</span>
      </div>
    </td>
    <td data-label="Set" className="hidden align-middle px-4 py-3 text-sm text-white/80 lg:table-cell">
      {product?.consoleUri || 'N/A'}
    </td>
    <td data-label="Ungraded" className="align-middle px-4 py-3 text-sm text-white/80">
      {formatPrice(product?.price1)}
    </td>
    <td data-label="PSA 9" className="align-middle px-4 py-3 text-sm text-white/80">
      {formatPrice(product?.price3)}
    </td>
    <td data-label="PSA 10" className="align-middle px-4 py-3 text-sm font-semibold text-white">
      {formatPrice(product?.price2)}
    </td>
  </tr>
);

