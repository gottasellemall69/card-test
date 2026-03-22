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
      className={`sticky top-0 bg-slate-950/85 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur ${className}`}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 rounded-md text-left transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
      >
        <span>{title}</span>
        {sortIcon ? <span className="text-[0.7rem] text-indigo-300">{sortIcon}</span> : null}
      </button>
    </th>
  );
};

export default TableHeader;
