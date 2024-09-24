
'use client';
import { useState } from 'react';

const YugiohSearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    // Reset the view if the search term is cleared
    if (value === '') {
      onSearch('');
    }
  };

  const handleSearch = () => {
    onSearch(searchTerm);
  };

  return (

    <div className="flex items-center justify-center mt-4">
      <input
        type="textarea"
        className="w-full md:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        placeholder="Search for a card..."
        value={searchTerm}
        onChange={handleInputChange}
      />
      <button
        type="submit"
        className="ml-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>

  );
};

export default YugiohSearchBar;
