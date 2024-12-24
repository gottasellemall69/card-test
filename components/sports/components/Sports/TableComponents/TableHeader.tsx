// src/components/Sports/TableComponents/TableHeader.tsx
import React from 'react';

interface TableHeaderProps {
  title: string;
  sortKey: string;
  onSort: (key: string) => void;
  getSortIcon: (key: string) => string | null;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  sortKey,
  onSort,
  getSortIcon,
  className = ''
}) => (
  <th
    scope="col"
    className={`sticky top-0 p-1 border-b border-gray-300 bg-stone-500 bg-opacity-20 
                outline-1 outline-black text-center text-shadow text-lg font-black 
                text-white backdrop-blur backdrop-filter whitespace-nowrap cursor-pointer ${className}`}
    onClick={() => onSort(sortKey)}
  >
    <div className="flex items-center justify-center space-x-1">
      <span>{title}</span>
      {getSortIcon(sortKey) && (
        <span className="text-xs">{getSortIcon(sortKey)}</span>
      )}
    </div>
  </th>
);