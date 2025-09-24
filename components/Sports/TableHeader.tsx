import React from 'react';

type TableHeaderProps = {
  title: string;
  sortKey: string;
  onSort: (key: string) => void;
  getSortIcon: (key: string) => string | null;
  className?: string;
};

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  sortKey,
  onSort,
  getSortIcon,
  className = '',
}) => {
  const sortIcon = getSortIcon(sortKey);

  return (
    <th
      scope="col"
      className={`sticky top-0 bg-slate-900/70 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur transition-colors hover:text-white ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {title}
        {sortIcon ? <span className="text-[0.7rem] text-indigo-300">{sortIcon}</span> : null}
      </span>
    </th>
  );
};

export default TableHeader;
