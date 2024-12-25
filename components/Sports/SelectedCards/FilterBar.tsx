import React from 'react';

interface FilterBarProps {
  onSortChange: (value: string) => void;
  onSearch: (value: string) => void;
  searchTerm: string;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onSortChange,
  onSearch,
  searchTerm,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg mb-4 flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex-shrink-0">
        <select
          onChange={(e) => onSortChange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="dateAdded-desc">Newest First</option>
          <option value="dateAdded-asc">Oldest First</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="price-desc">Price (High-Low)</option>
          <option value="price-asc">Price (Low-High)</option>
        </select>
      </div>
    </div>
  );
};

export default FilterBar;