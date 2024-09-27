import { useState } from 'react';

const YugiohSearchBar = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');


  const handleInputChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (value === '') {
      onSearch('');
    }
    onSearch(value);
  };

  return (
    <div className="flex items-center justify-center mt-4">
      <input
        type="text"
        className="w-full md:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
        placeholder="Search for a card..."
        value={searchTerm}
        onChange={handleInputChange}
      />
    </div>
  );
};

export default YugiohSearchBar;
